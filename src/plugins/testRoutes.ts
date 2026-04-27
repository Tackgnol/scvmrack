import type { FastifyPluginAsync } from 'fastify';
import auth from '../services/auth.js';
import {
  bindCharacterToUser,
  deleteCharacter,
  generateCharacter,
  Json,
  listUserCharacters,
  updateCharacter,
} from '../queries/characters.queries.js';
import db from '../services/db.js';
import { generateEmailBlindIndex } from '../services/crypto.js';

const testRoutesPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  if (process.env.ENABLE_TEST_ROUTES === '1' && process.env.NODE_ENV !== 'test') {
    throw new Error(
      'ENABLE_TEST_ROUTES=1 is set but NODE_ENV is not "test". ' +
        'This is a config drift guard; check your compose file.'
    );
  }

  if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_TEST_ROUTES !== '1') {
    return;
  }

  fastify.post('/users', async (request, reply) => {
    const { name, email, password } = request.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const resolvedName = name ?? 'Test User';
    const resolvedEmail = email ?? `test_${crypto.randomUUID()}@example.com`;
    const resolvedPassword = password ?? 'TestPassword123!';
    const emailBidx = `${generateEmailBlindIndex(resolvedEmail)}@bidx.local`;

    const baseUrl = process.env.AUTH_BASE_URL || 'http://localhost:3000/auth';

    const signUpReq = new Request(`${baseUrl}/sign-up/email`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-plain-email': resolvedEmail,
      },
      body: JSON.stringify({
        email: emailBidx,
        password: resolvedPassword,
        name: resolvedName,
        plainTextEmailForEncryption: resolvedEmail,
      }),
    });

    const signUpRes = await auth.handler(signUpReq);

    if (!signUpRes.ok) {
      const err = await signUpRes.text();
      request.log.error({ err }, 'test-routes: user creation failed');
      return reply.status(500).send({ error: `User creation failed: ${err}` });
    }

    let userId: string | undefined;
    try {
      const signUpData = await signUpRes.json() as { user?: { id: string } };
      userId = signUpData?.user?.id;
    } catch {
      /* ignore parse failure */
    }

    if (!userId) {
      const result = await db.query<{ id: string }>(
        'SELECT id FROM "user" WHERE email_bidx = $1',
        [emailBidx]
      );
      userId = result.rows[0]?.id;
    }

    if (!userId) {
      return reply.status(500).send({ error: 'Could not retrieve userId' });
    }

    await db.query('UPDATE "user" SET "emailVerified" = true WHERE id = $1', [userId]);

    const signInReq = new Request(`${baseUrl}/sign-in/email`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-plain-email': resolvedEmail,
      },
      body: JSON.stringify({ email: emailBidx, password: resolvedPassword }),
    });

    const signInRes = await auth.handler(signInReq);
    if (!signInRes.ok) {
      const err = await signInRes.text();
      request.log.error({ err, userId }, 'test-routes: sign-in failed');
      return reply.status(500).send({ error: `Sign-in failed: ${err}` });
    }

    const setCookies = signInRes.headers.getSetCookie?.() ?? [];
    const sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');

    return reply.send({ userId, sessionCookie });
  });

  fastify.post('/characters', async (request, reply) => {
    const { userId, classId, overrides } = request.body as {
      userId?: string;
      classId?: number | null;
      overrides?: Record<string, Json>;
    };

    if (!userId) {
      return reply.status(400).send({ error: 'userId required' });
    }

    try {
      const [result] = await generateCharacter.run({ classId: classId ?? null }, db);

      if (!result) {
        return reply.status(500).send({ error: 'Failed to generate character' });
      }

      const characterId = result.generateCharacter;

      // Bind character to the specified user
      await bindCharacterToUser.run({ userId, id: characterId! }, db);

      if (overrides && Object.keys(overrides).length > 0) {
        await updateCharacter.run({ id: characterId!, patch: overrides }, db);
      }

      return reply.send({ id: characterId });
    } catch (err) {
      request.log.error(err, 'test-routes: character creation failed');
      return reply.status(500).send({ error: 'Failed to create character' });
    }
  });

  fastify.delete('/data', async (request, reply) => {
    const { email } = request.query as { email?: string };

    if (!email) {
      return reply.status(400).send({ error: 'email query param required' });
    }

    try {
      const emailBidx = `${generateEmailBlindIndex(email)}@bidx.local`;
      const result = await db.query<{ id: string }>(
        'SELECT id FROM "user" WHERE email_bidx = $1',
        [emailBidx]
      );
      const userId = result.rows[0]?.id;

      if (!userId) {
        return reply.status(204).send();
      }

      const characters = await listUserCharacters.run({ userId, locale: 'en' }, db);
      for (const char of characters) {
        await deleteCharacter.run({ id: char.id }, db);
      }

      await db.query('DELETE FROM verification WHERE identifier = $1', [emailBidx]);
      await db.query('DELETE FROM "user" WHERE id = $1', [userId]);

      return reply.status(204).send();
    } catch (err) {
      request.log.error(err, 'test-routes: teardown failed');
      return reply.status(500).send({ error: 'Teardown failed' });
    }
  });
};

export default testRoutesPlugin;
