import { FastifyPluginAsync } from 'fastify';
import { query, queryOne } from '../../services/db.js';
import {
  decryptEmail,
  generateEmailBlindIndex,
} from '../../services/crypto.js';
import auth from '../../services/auth.js';
import {
  isTurnstileEnabled,
  verifyTurnstileToken,
} from '../../services/turnstile.js';
import {
  CLAIM_CHARACTER_QUERY_PARAM,
  CLAIM_SIG_QUERY_PARAM,
  CLAIM_USER_QUERY_PARAM,
  verifyClaimSignature,
} from '../../services/claimSignature.js';

const authRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const protectedAuthPaths = [
    '/sign-in/email',
    '/sign-up/email',
    '/sign-in/magic-link',
  ];
  const parseCallbackUrl = (rawCallback: string): URL | null => {
    if (!rawCallback) {
      return null;
    }

    try {
      return rawCallback.startsWith('/')
        ? new URL(rawCallback, 'http://localhost')
        : new URL(rawCallback);
    } catch {
      return null;
    }
  };

  fastify.get('/me', async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers as any,
      });

      if (!session?.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      // Fetch the encrypted email from database
      const userData = await queryOne<{ encrypted_email: string }>(
        'SELECT encrypted_email FROM "user" WHERE id = $1',
        [session.user.id]
      );

      // Decrypt the email
      const decryptedEmail = userData?.encrypted_email
        ? decryptEmail(userData.encrypted_email)
        : null;

      reply.header(
        'cache-control',
        'no-store, no-cache, must-revalidate, private'
      );
      reply.header('pragma', 'no-cache');

      return reply.send({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: decryptedEmail,
          emailVerified: session.user.emailVerified,
          isAnonymous: Boolean((session.user as any).isAnonymous),
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });

  fastify.all(
    '/*',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      try {
        // Better Auth strictly checks the request URL against its configured baseURL.
        // By using AUTH_BASE_URL (or localhost fallback) here, we ensure Better Auth
        // accepts the request, while still honoring the original request's Origin
        // via the trustedOrigins configuration for alternative domains.
        const authBaseUrl =
          process.env.AUTH_BASE_URL || 'http://localhost:3000/auth';
        const base = new URL(authBaseUrl);
        const fullUrl = `${base.origin}${request.url}`;

        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          // Filter out headers that the 'new Request' constructor should handle
          if (['content-length', 'host'].includes(key.toLowerCase())) return;
          if (value)
            headers.append(
              key,
              Array.isArray(value) ? value.join(', ') : value
            );
        });

        let body = request.body as Record<string, any> | undefined;
        let plainEmail: string | undefined;
        const rawPath = request.url.split('?')[0];
        const requestPath = rawPath.startsWith('/auth/')
          ? rawPath.slice('/auth'.length)
          : rawPath;
        const requiresTurnstile =
          request.method === 'POST' &&
          protectedAuthPaths.some((path) => requestPath.includes(path));

        if (requiresTurnstile && isTurnstileEnabled()) {
          const turnstileToken =
            typeof body?.turnstileToken === 'string' ? body.turnstileToken : '';

          if (!turnstileToken) {
            return reply
              .status(400)
              .send({ error: 'Captcha verification is required' });
          }

          const verification = await verifyTurnstileToken(
            turnstileToken,
            request.ip
          );
          if (!verification.success) {
            request.log.warn(
              { errorCodes: verification.errorCodes },
              'Turnstile verification failed'
            );
            return reply
              .status(400)
              .send({ error: 'Captcha verification failed' });
          }
        }

        if (body && 'turnstileToken' in body) {
          delete body.turnstileToken;
        }

        if (body?.email && typeof body.email === 'string') {
          const isMagicLink = request.url.includes('magic-link');
          const isSignUp = request.url.includes('sign-up') || isMagicLink;

          plainEmail = body.email; // Store the real email
          const hash = generateEmailBlindIndex(plainEmail);

          if (isSignUp) {
            body.plainTextEmailForEncryption = plainEmail;
          }
          body.email = `${hash}@bidx.local`;

          // Pass the plain email via a custom header for the plugin to read easily
          headers.set('x-plain-email', plainEmail);
        }

        const req = new Request(fullUrl, {
          method: request.method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const response = await auth.handler(req);

        // Auto-claim guest characters after successful email verification.
        // The callbackURL carries a signed claim payload set in sendVerificationEmail.
        if (
          requestPath === '/verify-email' &&
          response.status >= 300 &&
          response.status < 400
        ) {
          try {
            const verifyUrl = new URL(fullUrl);
            const verifyParams = verifyUrl.searchParams;
            const rawCallback = verifyParams.get('callbackURL') || '';
            const parsedCallback = parseCallbackUrl(rawCallback);
            const callbackParams = parsedCallback?.searchParams;

            // Some mail clients / browser flows may flatten callbackURL query params
            // into the top-level verify-email query string. Read both sources.
            const characterId =
              callbackParams?.get(CLAIM_CHARACTER_QUERY_PARAM) ||
              callbackParams?.get('character') ||
              verifyParams.get(CLAIM_CHARACTER_QUERY_PARAM) ||
              verifyParams.get('character');
            const claimUserId =
              callbackParams?.get(CLAIM_USER_QUERY_PARAM) ||
              verifyParams.get(CLAIM_USER_QUERY_PARAM);
            const claimSignature =
              callbackParams?.get(CLAIM_SIG_QUERY_PARAM) ||
              verifyParams.get(CLAIM_SIG_QUERY_PARAM);

            if (characterId && claimUserId && claimSignature) {
              const owner = await queryOne<{ user_id: string | null }>(
                `SELECT user_id FROM characters WHERE id = $1`,
                [characterId]
              );

              const claimSourceId = owner?.user_id;
              if (!claimSourceId) {
                request.log.warn(
                  { characterId, claimUserId },
                  'Skipped auto-claim: missing source owner on character'
                );
                return;
              }

              const isValidSignature = verifyClaimSignature(
                claimUserId,
                claimSourceId,
                characterId,
                claimSignature
              );

              if (isValidSignature) {
                // Migrate ownership from anonymous user id -> verified user id.
                const claimedCharacters = await query<{ id: string }>(
                  `UPDATE characters SET user_id = $1
                                 WHERE user_id = $2
                                 RETURNING id`,
                  [claimUserId, claimSourceId]
                );
                request.log.info(
                  {
                    userId: claimUserId,
                    characterId,
                    claimedCount: claimedCharacters.length,
                  },
                  'Auto-claimed guest characters after verification (signed callback)'
                );
              } else {
                request.log.warn(
                  { characterId, claimSourceId, claimUserId },
                  'Skipped auto-claim: invalid callback signature'
                );
              }
            }
          } catch (err) {
            request.log.warn(
              err,
              'Auto-claim after verification failed (non-fatal)'
            );
          }
        }

        reply.status(response.status);
        response.headers.forEach((v, k) => reply.header(k, v));

        // Prevent session tokens from leaking via browser/proxy/CDN caches.
        reply.header(
          'cache-control',
          'no-store, no-cache, must-revalidate, private'
        );
        reply.header('pragma', 'no-cache');

        return reply.send(await response.text());
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Internal Auth Error' });
      }
    }
  );
};

export default authRoutes;
