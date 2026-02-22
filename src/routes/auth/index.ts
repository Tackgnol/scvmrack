import { FastifyPluginAsync } from 'fastify';
import {queryOne} from "../../services/db.js";
import {decryptEmail, generateEmailBlindIndex} from "../../services/crypto.js";
import auth from '../../services/auth.js';
import {isTurnstileEnabled, verifyTurnstileToken} from "../../services/turnstile.js";

const authRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
    const protectedAuthPaths = ['/sign-in/email', '/sign-up/email', '/sign-in/magic-link'];

    fastify.get('/me', async (request, reply) => {
        try {
            const session = await auth.api.getSession({
                headers: request.headers as any
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

            return reply.send({
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: decryptedEmail,
                    emailVerified: session.user.emailVerified,
                }
            });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to get user' });
        }
    });

    fastify.all('/*', async (request, reply) => {
        try {
            const protocol = request.protocol;
            const host = request.headers.host;
            const fullUrl = `${protocol}://${host}${request.url}`;

            const headers = new Headers();
            Object.entries(request.headers).forEach(([key, value]) => {
                // Filter out headers that the 'new Request' constructor should handle
                if (['content-length', 'host'].includes(key.toLowerCase())) return;
                if (value) headers.append(key, Array.isArray(value) ? value.join(', ') : value);
            });

            let body = request.body as Record<string, any> | undefined;
            let plainEmail: string | undefined;
            const requestPath = request.url.split('?')[0];
            const requiresTurnstile = request.method === 'POST'
                && protectedAuthPaths.some((path) => requestPath.includes(path));

            if (requiresTurnstile && isTurnstileEnabled()) {
                const turnstileToken = typeof body?.turnstileToken === 'string'
                    ? body.turnstileToken
                    : '';

                if (!turnstileToken) {
                    return reply.status(400).send({ error: 'Captcha verification is required' });
                }

                const verification = await verifyTurnstileToken(turnstileToken, request.ip);
                if (!verification.success) {
                    request.log.warn({ errorCodes: verification.errorCodes }, 'Turnstile verification failed');
                    return reply.status(400).send({ error: 'Captcha verification failed' });
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

            console.log("SENDING TO AUTH:", {
                url: fullUrl,
                email: body?.email,
                hasPlainHeader: !!plainEmail
            });

            const req = new Request(fullUrl, {
                method: request.method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            const response = await auth.handler(req);

            reply.status(response.status);
            response.headers.forEach((v, k) => reply.header(k, v));
            return reply.send(await response.text());

        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Internal Auth Error' });
        }
    });
};

export default authRoutes;
