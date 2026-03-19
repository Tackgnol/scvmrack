import {betterAuth} from "better-auth";
import {anonymous, magicLink} from "better-auth/plugins";
import {Pool} from "pg";
import {magicLinkEmail} from "../emails/magicLinkEmail.js";
import {verificationEmail} from "../emails/verificationEmail.js";
import {decryptEmail, encryptEmail} from "./crypto.js";
import {sendEmail} from "./nodemailer.js";
import {
    buildClaimSignature,
    CLAIM_CHARACTER_QUERY_PARAM,
    CLAIM_SESSION_QUERY_PARAM,
    CLAIM_SIG_QUERY_PARAM,
    CLAIM_USER_QUERY_PARAM,
} from "./claimSignature.js";

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: isNaN(Number(process.env.DATABASE_PORT)) ? 5432 : Number(process.env.DATABASE_PORT),
});

const auth = betterAuth({
    database: pool,
    trustedOrigins: [
        "http://localhost:5173",
        "https://scvmgrinder.tackgnol.usermd.net",
        "https://scvmgrinder.rpgtools.eu.org"
    ],
    baseURL: process.env.AUTH_BASE_URL || "http://localhost:3000/auth",
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
    },

    plugins: [
        anonymous({
            onLinkAccount: async ({anonymousUser, newUser}) => {
                await pool.query(
                    `UPDATE characters
                     SET user_id = $1
                     WHERE user_id = $2`,
                    [newUser.user.id, anonymousUser.user.id]
                );
            },
        }),
        magicLink({
            sendMagicLink: async ({email, url}, ctx) => {
                const body = (ctx as any).body;
                const request = (ctx as any).request || ctx;

                // This is already the PLAIN email from our interceptor
                const recipientEmail = request.headers.get('x-plain-email') || body?.plainTextEmailForEncryption;

                if (!recipientEmail) {
                    // Fallback for existing users: search DB
                    const {rows} = await pool.query('SELECT encrypted_email FROM "user" WHERE email_bidx = $1', [email]);
                    if (rows[0]?.encrypted_email) {
                        // EXPLICIT DECRYPT only when we know it's the DB string
                        const decrypted = decryptEmail(rows[0].encrypted_email);
                        return await sendEmail(decrypted, "Login Link", `Link: ${url}`);
                    }
                    throw new Error("Email not found");
                }

                if (!recipientEmail) {
                    throw new Error("Could not resolve recipient email.");
                }

                const verificationUrl = new URL(url);
                const callback = verificationUrl.searchParams.get("callbackURL");
                
                const reqOrigin = request.headers.get('origin') || request.headers.get('referer');
                const originToUse = reqOrigin ? new URL(reqOrigin).origin : (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000');
                
                if (!callback || callback.includes(":3000") || callback.includes("localhost")) {
                    verificationUrl.searchParams.set("callbackURL", originToUse);
                } else if (callback.startsWith('/')) {
                    verificationUrl.searchParams.set("callbackURL", `${originToUse}${callback}`);
                }

                await sendEmail(
                    recipientEmail,
                    "Your Scvmgrinder login Link",
                    magicLinkEmail(verificationUrl.toString())
                );
            },
        }),

    ],

    user: {
        fields: {
            email: "email_bidx", // This column now stores "hash@bidx.local"
        },
        additionalFields: {
            encrypted_email: {type: "string", required: false, input: false},
            plainTextEmailForEncryption: {type: "string", required: false, input: true},
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
                            encrypted_email: encryptEmail(rawEmail || ""),
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

        sendVerificationEmail: async ({user, url}, request) => {
            const reqOrigin = request?.headers?.get('origin') || request?.headers?.get('referer');
            const originToUse = reqOrigin ? new URL(reqOrigin).origin : (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000');

            // Embed a signed ownership source + character id in callbackURL.
            // This survives email verification across browsers/devices.
            const currentSession = request
                ? await auth.api.getSession({ headers: request.headers as any }).catch(() => null)
                : null;
            const currentUser = currentSession?.user as { id: string; isAnonymous?: boolean } | undefined;

            const claimSourceId = currentUser?.id && currentUser.isAnonymous
                ? currentUser.id
                : null;

            let characterId: string | null = null;
            if (claimSourceId) {
                const { rows } = await pool.query(
                    'SELECT id FROM characters WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
                    [claimSourceId]
                );
                characterId = rows[0]?.id || null;
            }

            const verificationUrl = new URL(url);
            const callbackSearchParams = new URLSearchParams();

            if (characterId) {
                callbackSearchParams.set('character', characterId);

                if (claimSourceId) {
                    verificationUrl.searchParams.set(CLAIM_CHARACTER_QUERY_PARAM, characterId);
                    verificationUrl.searchParams.set(CLAIM_SESSION_QUERY_PARAM, claimSourceId);
                    verificationUrl.searchParams.set(CLAIM_USER_QUERY_PARAM, user.id);

                    const signature = buildClaimSignature(user.id, claimSourceId, characterId);
                    if (signature) {
                        verificationUrl.searchParams.set(CLAIM_SIG_QUERY_PARAM, signature);
                    }
                }
            }

            const callbackPath = callbackSearchParams.toString().length > 0
                ? `/?${callbackSearchParams.toString()}`
                : '/';
            verificationUrl.searchParams.set('callbackURL', `${originToUse}${callbackPath}`);

            const realEmail = decryptEmail((user as any).encrypted_email);
            await sendEmail(
                realEmail,
                "Verify your Scvmgrinder account",
                verificationEmail(verificationUrl.toString())
            );
        },
    },
});

export {decryptEmail};
export default auth;
