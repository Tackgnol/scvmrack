import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';

let submitted = 0;
mock.module('../../src/services/moderation-service.js', {
  namedExports: {
    createModerationService: () => ({
      submit: async () => {
        submitted += 1;
        return {
          ok: true,
          value: { id: '550e8400-e29b-41d4-a716-446655440000' },
        };
      },
    }),
  },
});

const { default: reportRoutes } = await import('../../src/routes/reports/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(reportRoutes);
  await app.ready();
  return app;
}



test('accepts a class owner removal request', async () => {
  submitted = 0;
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/',
    payload: {
      classId: 9,
      reason: 'owner_removal',
      explanation: 'I no longer want this shown.',
      reporterName: 'GM',
      reporterEmail: 'gm@example.com',
      goodFaith: true,
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(submitted, 1);
  await app.close();
});
