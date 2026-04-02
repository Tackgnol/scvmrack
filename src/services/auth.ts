import { betterAuth } from 'better-auth';
import { anonymous, magicLink } from 'better-auth/plugins';
import { magicLinkEmail } from '../emails/magicLinkEmail.js';
import { resetPasswordEmail } from '../emails/resetPasswordEmail.js';
import { verificationEmail } from '../emails/verificationEmail.js';
import { decryptEmail, encryptEmail } from './crypto.js';
import { clearLoginFailures } from './loginLockout.js';
import { sendEmail } from './nodemailer.js';
import pool from './db.js';
import {
  buildClaimSignature,
  CLAIM_CHARACTER_QUERY_PARAM,
  CLAIM_SOURCE_QUERY_PARAM,
  CLAIM_SIG_QUERY_PARAM,
  CLAIM_TS_QUERY_PARAM,
  CLAIM_USER_QUERY_PARAM,
} from './claimSignature.js';
import {
  getLatestCharacterIdByUserId,
  getUserEmailBidxById,
  getUserEncryptedEmailByBidx,
  getUserEncryptedEmailById,
  transferCharacterOwnership,
} from '../queries/auth.queries.js';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://scvmrack.rpgtools.eu.org',
  ...[process.env.CLIENT_ORIGIN, process.env.CLIENT_GATEWAY].filter(Boolean),
] as string[];

function resolveAllowedOrigin(request: Request | null): string {
  const fallback = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
  if (!request) return fallback;

  const reqOrigin =
    request.headers.get('origin') || request.headers.get('referer');
  if (!reqOrigin) return fallback;

  try {
    const origin = new URL(reqOrigin).origin;
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
  } catch {
    /* invalid URL, use fallback */
  }

  return fallback;
}

const auth = betterAuth({
  database: pool,
  trustedOrigins: [
    'http://localhost:5173',
    'https://scvmrack.rpgtools.eu.org',
    ...[process.env.CLIENT_ORIGIN, process.env.CLIENT_GATEWAY].filter(
      (x): x is string => Boolean(x)
    ),
  ],
  baseURL: process.env.AUTH_BASE_URL || 'http://localhost:3000/auth',
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }, request) => {
      const originToUse = resolveAllowedOrigin(request ?? null);

      const resetUrl = new URL(url);
      // Rewrite the redirect so the user lands on the FE reset page.
      resetUrl.searchParams.set(
        'callbackURL',
        `${originToUse}/reset-password`
      );

      // Query DB directly — Better Auth may not include additionalFields in this callback's user object
      const [row] = await getUserEncryptedEmailById.run(
        { id: user.id },
        pool
      );
      const realEmail = decryptEmail(row!.encryptedEmail);
      await sendEmail(
        realEmail,
        'Reset your Scvmrack password',
        resetPasswordEmail(resetUrl.toString())
      );
    },
    onPasswordReset: async ({ user }) => {
      // Clear any active login lockout so the user can immediately log in
      // with their new password after a successful reset.
      const [row] = await getUserEmailBidxById.run(
        { id: user.id },
        pool
      );
      const emailBidx: string | undefined = row?.emailBidx;
      if (emailBidx) {
        // email_bidx is stored as "${hash}@bidx.local"; the lockout key is the hash part
        clearLoginFailures(emailBidx.split('@')[0]);
      }
    },
  },

  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await transferCharacterOwnership.run(
          { userId: newUser.user.id, guestId: anonymousUser.user.id },
          pool
        );
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }, ctx) => {
        const body = (ctx as any).body;
        const request = (ctx as any).request || ctx;

        // This is already the PLAIN email from our interceptor
        const recipientEmail =
          request.headers.get('x-plain-email') ||
          body?.plainTextEmailForEncryption;

        if (!recipientEmail) {
          // Fallback for existing users: search DB
          const [row] = await getUserEncryptedEmailByBidx.run(
            { emailBidx: email },
            pool
          );
          if (row?.encryptedEmail) {
            // EXPLICIT DECRYPT only when we know it's the DB string
            const decrypted = decryptEmail(row.encryptedEmail);
            return await sendEmail(decrypted, 'Login Link', `Link: ${url}`);
          }
          throw new Error('Email not found');
        }

        const verificationUrl = new URL(url);
        const callback = verificationUrl.searchParams.get('callbackURL');
        const originToUse = resolveAllowedOrigin(request);

        if (
          !callback ||
          callback.includes(':3000') ||
          callback.includes('localhost')
        ) {
          verificationUrl.searchParams.set('callbackURL', originToUse);
        } else if (callback.startsWith('/')) {
          verificationUrl.searchParams.set(
            'callbackURL',
            `${originToUse}${callback}`
          );
        }

        await sendEmail(
          recipientEmail,
          'Your Scvmrack login link',
          magicLinkEmail(verificationUrl.toString())
        );
      },
    }),
  ],

  user: {
    fields: {
      email: 'email_bidx', // This column now stores "hash@bidx.local"
    },
    additionalFields: {
      encrypted_email: { type: 'string', required: false, input: false },
      plainTextEmailForEncryption: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // IMPORTANT: Cast to any or the interface to avoid TS errors
          const data = user as any;
          const rawEmail = data.plainTextEmailForEncryption;

          return {
            data: {
              ...user,
              encrypted_email: encryptEmail(rawEmail || ''),
              plainTextEmailForEncryption: undefined,
            },
          };
        },
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }, request) => {
      const originToUse = resolveAllowedOrigin(request ?? null);

      // Embed a signed ownership source + character id in callbackURL.
      // This survives email verification across browsers/devices.
      const currentSession = request
        ? await auth.api
            .getSession({ headers: request.headers as any })
            .catch(() => null)
        : null;
      const currentUser = currentSession?.user as
        | { id: string; isAnonymous?: boolean }
        | undefined;

      const claimSourceId =
        currentUser?.id && currentUser.isAnonymous ? currentUser.id : null;

      let characterId: string | null = null;
      if (claimSourceId) {
        const [row] = await getLatestCharacterIdByUserId.run(
          { userId: claimSourceId },
          pool
        );
        characterId = row?.id || null;
      }

      const verificationUrl = new URL(url);
      const callbackSearchParams = new URLSearchParams();

      if (characterId) {
        callbackSearchParams.set('character', characterId);

        if (claimSourceId) {
          const issuedAt = Date.now();
          verificationUrl.searchParams.set(
            CLAIM_CHARACTER_QUERY_PARAM,
            characterId
          );
          verificationUrl.searchParams.set(
            CLAIM_SOURCE_QUERY_PARAM,
            claimSourceId
          );
          verificationUrl.searchParams.set(CLAIM_USER_QUERY_PARAM, user.id);
          verificationUrl.searchParams.set(CLAIM_TS_QUERY_PARAM, String(issuedAt));

          const signature = buildClaimSignature(
            user.id,
            claimSourceId,
            characterId,
            issuedAt
          );
          if (signature) {
            verificationUrl.searchParams.set(CLAIM_SIG_QUERY_PARAM, signature);
          }
        }
      }

      const callbackPath =
        callbackSearchParams.toString().length > 0
          ? `/?${callbackSearchParams.toString()}`
          : '/';
      verificationUrl.searchParams.set(
        'callbackURL',
        `${originToUse}${callbackPath}`
      );

      const realEmail = decryptEmail((user as any).encrypted_email);
      await sendEmail(
        realEmail,
        'Verify your Scvmrack account',
        verificationEmail(verificationUrl.toString())
      );
    },
  },
});

export { decryptEmail };
export default auth;
