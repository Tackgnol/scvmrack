import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import Fastify from 'fastify';

mock.module('../../src/repositories/moderation-repository.js', {
  namedExports: { moderationRepository: {} },
});

mock.module('../../src/repositories/creation-ban-repository.js', {
  namedExports: { creationBanRepository: {} },
});

const { default: adminRoutes } = await import('../../src/routes/admin/index.js');

test('non-admin moderation queue and decision requests return 404', async () => {
  const app = Fastify({ logger: false });
  app.addHook('preHandler', async (request) => {
    Object.assign(request, { appSession: { user: { id: 'regular-user' } } });
  });
  await app.register(adminRoutes);
  try {
    const queue = await app.inject({ method: 'GET', url: '/reports' });
    assert.equal(queue.statusCode, 404);
    assert.equal(queue.json().code, 'MODERATION_NOT_FOUND');

    const decision = await app.inject({
      method: 'POST',
      url: '/reports/550e8400-e29b-41d4-a716-446655440000/dismiss',
      payload: { reason: 'Review complete' },
    });
    assert.equal(decision.statusCode, 404);
    assert.equal(decision.json().code, 'MODERATION_NOT_FOUND');

    const banHistory = await app.inject({ method: 'GET', url: '/creation-bans/gm-1' });
    assert.equal(banHistory.statusCode, 404);
    assert.equal(banHistory.json().code, 'MODERATION_NOT_FOUND');

    const ban = await app.inject({ method: 'POST', url: '/creation-bans/gm-1', payload: { reason: 'Abuse' } });
    assert.equal(ban.statusCode, 404);
    assert.equal(ban.json().code, 'MODERATION_NOT_FOUND');
  } finally {
    await app.close();
  }
});
