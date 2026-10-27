import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

test('catalog responses preserve each item kind, rule JSON and nullable fields', async () => {
  for (const [kind, fields] of [
    ['weapon', ['dice', 'damageModifier', 'effect', 'modifiers', 'ammoType']],
    ['armor', ['dice', 'maxTier', 'modifiers']],
    ['equipment', ['amountMin', 'hpMod', 'multiple', 'useEffect']],
    ['pet', ['hp', 'actionDie', 'buff', 'amountDie']],
  ] as const) {
    const response = await fetch(`${baseUrl}/api/equipment/${kind}/1`);
    assert.equal(response.status, 200, `${kind} is readable`);
    const item = await response.json() as Record<string, unknown>;
    assert.equal(item.id, 1);
    assert.equal(typeof item.key, 'string');
    assert.ok(Array.isArray(item.tags));
    assert.equal(item.classId, null);
    assert.equal(item.position, null);
    for (const field of fields) {
      assert.ok(Object.hasOwn(item, field), `${kind} retains ${field}`);
    }
  }
});

test('catalog equipment retains a non-null integer health modifier', async (t) => {
  const prisma = new PrismaClient();
  const key = `qa.contract-health.${randomUUID()}`;
  t.after(async () => {
    try {
      await prisma.equipment.deleteMany({ where: { key } });
    } finally {
      await prisma.$disconnect();
    }
  });
  const item = await prisma.equipment.create({ data: { key, tags: [], hpMod: 3 } });
  const response = await fetch(`${baseUrl}/api/equipment/equipment/${item.id}`);
  assert.equal(response.status, 200);
  const body = await response.json() as { hpMod: unknown };
  assert.equal(body.hpMod, 3);
});

test('CATS invalid class requests remain typed validation errors', async () => {
  for (const path of ['/api/characters/classes?locale=invalid', '/api/classes/details/0']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 400);
    const error = await response.json() as { statusCode: number; code: string; requestId: string };
    assert.equal(error.statusCode, 400);
    assert.ok(error.code);
    assert.ok(error.requestId);
  }
});

test('binding responses retain nullable connection and player fields plus the token generation', async () => {
  const signedIn = await fetch(baseUrl + '/api/auth/sign-in/anonymous', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(signedIn.status, 200);
  const token = signedIn.headers.get('set-auth-token');
  assert.ok(token);
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const created = await fetch(baseUrl + '/api/characters/new', { method: 'POST', headers, body: '{}' });
  assert.equal(created.status, 201);
  const { id } = await created.json() as { id: string };
  const roomId = `contracts-${randomUUID()}`;
  try {
    for (const binding of ['players/player-1', 'tokens/token-1']) {
      const response = await fetch(`${baseUrl}/api/obr/rooms/${roomId}/${binding}/character`, {
        method: 'PUT', headers, body: JSON.stringify({ characterId: id }),
      });
      assert.equal(response.status, 200);
    }
    const response = await fetch(`${baseUrl}/api/obr/rooms/${roomId}/bindings`);
    assert.equal(response.status, 200);
    const body = await response.json() as {
      roomId: string;
      players: Array<{ playerId: string; connectionId: string | null; characterId: string; assignedByPlayerId: string }>;
      tokens: Array<{ tokenId: string; playerId: string | null; characterId: string; generation: string }>;
    };
    assert.equal(body.roomId, roomId);
    assert.deepEqual(body.players, [{ playerId: 'player-1', connectionId: null, characterId: id, assignedByPlayerId: 'player-1' }]);
    assert.equal(body.tokens.length, 1);
    assert.deepEqual({ ...body.tokens[0], generation: undefined }, { tokenId: 'token-1', playerId: null, characterId: id, generation: undefined });
    assert.match(body.tokens[0].generation, /^[0-9a-f-]{36}$/);
  } finally {
    const deleted = await fetch(`${baseUrl}/api/characters/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    await fetch(baseUrl + '/api/auth/sign-out', { method: 'POST', headers, body: '{}' });
    assert.equal(deleted.status, 204);
  }
});
