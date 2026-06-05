import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';

type FindFirstArgs = {
  where: {
    id?: number;
    key?: string;
  };
};

const findFirstCalls: FindFirstArgs[] = [];

const staleSearchWeapon = {
  id: 42,
  key: 'weapons.sword',
  tags: ['weapon', 'melee'],
  dice: [6],
  value: 20,
};

const prismaMock = {
  weapon: {
    findFirst: async (args: FindFirstArgs) => {
      findFirstCalls.push(args);
      if (args.where.id === staleSearchWeapon.id) {
        return null;
      }
      if (args.where.key === staleSearchWeapon.key) {
        return staleSearchWeapon;
      }
      return null;
    },
  },
  armor: {
    findFirst: async () => null,
  },
  equipment: {
    findFirst: async () => null,
  },
  pet: {
    findFirst: async () => null,
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

const { default: equipmentRoutes } = await import('../../src/routes/equipment/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(equipmentRoutes);
  await app.ready();
  return app;
}

test('GET /:itemType/:id falls back to key when the search id is stale', async () => {
  findFirstCalls.length = 0;
  const app = await buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/weapon/42?key=weapons.sword',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), staleSearchWeapon);
  assert.deepEqual(findFirstCalls, [
    { where: { id: 42 } },
    { where: { key: 'weapons.sword' } },
  ]);

  await app.close();
});

test('GET /:itemType/:id returns a typed not-found response when id and key miss', async () => {
  findFirstCalls.length = 0;
  const app = await buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/weapon/999?key=weapons.missing',
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().code, 'ITEM_NOT_FOUND');
  assert.deepEqual(findFirstCalls, [
    { where: { id: 999 } },
    { where: { key: 'weapons.missing' } },
  ]);

  await app.close();
});
