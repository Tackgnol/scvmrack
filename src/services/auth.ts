import {betterAuth} from "better-auth";
import {magicLink} from "better-auth/plugins";
import {Pool} from "pg";
import {buildClientVerificationUrl} from "./url.js";
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
                }

                await sendEmail(
                    recipientEmail,
                    "Your Scvmgrinder login Link",
                    magicLinkEmail(buildClientVerificationUrl(verificationUrl.toString(), originToUse))
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

            // Embed the guest's character ID in the callbackURL so it survives
            // the email round-trip (works even if verified in a different browser).
            const cookieHeader = request?.headers?.get('cookie') || '';
            const guestMatch = cookieHeader.match(/guest-session=([^;]+)/);
            const guestSessionId = guestMatch?.[1];

            let characterId: string | null = null;
            if (guestSessionId) {
                const { rows } = await pool.query(
                    'SELECT id FROM characters WHERE session_id = $1 AND user_id IS NULL ORDER BY updated_at DESC LIMIT 1',
                    [guestSessionId]
                );
                characterId = rows[0]?.id || null;
            }

            const verificationUrl = new URL(url);
            const callbackSearchParams = new URLSearchParams();

            if (characterId) {
                callbackSearchParams.set('character', characterId);
                callbackSearchParams.set(CLAIM_CHARACTER_QUERY_PARAM, characterId);

                if (guestSessionId) {
                    callbackSearchParams.set(CLAIM_SESSION_QUERY_PARAM, guestSessionId);
                    callbackSearchParams.set(CLAIM_USER_QUERY_PARAM, user.id);

                    const signature = buildClaimSignature(user.id, guestSessionId, characterId);
                    if (signature) {
                        callbackSearchParams.set(CLAIM_SIG_QUERY_PARAM, signature);
                    }
                }
            }

            const callbackPath = callbackSearchParams.toString().length > 0
                ? `/?${callbackSearchParams.toString()}`
                : '/';
            verificationUrl.searchParams.set('callbackURL', callbackPath);

            const realEmail = decryptEmail((user as any).encrypted_email);
            await sendEmail(
                realEmail,
                "Verify your Scvmgrinder account",
                verificationEmail(buildClientVerificationUrl(verificationUrl.toString(), originToUse))
            );
        },
    },
});

export {decryptEmail};
export default auth;
