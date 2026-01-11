import {betterAuth} from "better-auth";
import {magicLink} from "better-auth/plugins";
import {Pool} from "pg";
import {buildClientVerificationUrl} from "./url.js";
import {magicLinkEmail} from "../emails/magicLinkEmail.js";
import {verificationEmail} from "../emails/verificationEmail.js";
import {decryptEmail, encryptEmail} from "./crypto.js";
import {sendEmail} from "./nodemailer.js";

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
        "https://scvmgrinder.tackgnol.usermd.net"
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
                if (!callback || callback.includes(":3000")) {
                    verificationUrl.searchParams.set("callbackURL", process.env.CLIENT_ORIGIN ?? 'http://localhost:3000' );
                }

                await sendEmail(
                    recipientEmail,
                    "Your Scvmgrinder login Link",
                    magicLinkEmail(buildClientVerificationUrl(url))
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

        sendVerificationEmail: async ({user, url}) => {
            const realEmail = decryptEmail((user as any).encrypted_email);
            await sendEmail(
                realEmail,
                "Verify your Scvmgrinder account",
                verificationEmail(buildClientVerificationUrl(url))
            );
        },
    },
});

export {decryptEmail};
export default auth;
