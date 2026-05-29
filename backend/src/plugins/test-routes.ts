import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { apiError, badRequest, sendApiError } from '../errors.js';

interface CreateUserBody {
  name?: string;
  email?: string;
  password?: string;
}

interface CreateCharacterBody {
  userId: string;
  name?: string;
}

export default fp(async function testRoutesPlugin(fastify: FastifyInstance) {
  if (process.env.ENABLE_TEST_ROUTES !== '1') return;

  fastify.log.warn('ENABLE_TEST_ROUTES=1 — registering /test/* fixture routes');

  fastify.post<{ Body: CreateUserBody }>('/test/users', async (request, reply) => {
    const { name, email } = request.body ?? {};

    const authBaseUrl = process.env.AUTH_BASE_URL ?? 'http://localhost:3000/api/auth';
    const response = await fastify.auth.handler(
      new Request(`${authBaseUrl}/sign-in/anonymous`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })
    );

    if (!response.ok) {
      const text = await response.text();
      request.log.warn({ detail: text }, 'Anonymous test sign-in failed');
      return sendApiError(
        reply,
        request,
        apiError(502, 'ANONYMOUS_SIGN_IN_FAILED', 'Anonymous sign-in failed')
      );
    }

    const setCookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookie = setCookies.join('; ');
    const payload = (await response.json()) as { user?: { id?: string } };
    const userId = payload?.user?.id;

    if (!userId || !sessionCookie) {
      return sendApiError(
        reply,
        request,
        apiError(
          502,
          'ANONYMOUS_SIGN_IN_INVALID_RESPONSE',
          'Anonymous sign-in returned an invalid response'
        )
      );
    }

    if (name || email) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          isAnonymous: false,
        },
      });
    }

    return reply.status(201).send({ userId, sessionCookie });
  });

  fastify.post<{ Body: CreateCharacterBody }>('/test/characters', async (request, reply) => {
    const { userId, name } = request.body ?? ({} as CreateCharacterBody);

    if (!userId) {
      return sendApiError(
        reply,
        request,
        badRequest('USER_ID_REQUIRED', 'userId required')
      );
    }

    const [result] = await prisma.$queryRaw<{ generateCharacter: string }[]>`
      SELECT generate_character(NULL::integer) AS "generateCharacter"
    `;

    const characterId = result?.generateCharacter;
    if (!characterId) {
      return sendApiError(
        reply,
        request,
        apiError(500, 'CHARACTER_GENERATION_FAILED', 'Failed to generate character')
      );
    }

    await prisma.character.update({
      where: { id: characterId },
      data: {
        userId,
        ...(name ? { name: name.slice(0, 255) } : {}),
      },
    });

    return reply.status(201).send({ id: characterId });
  });
});
