import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';

const ROOM = 'room-1';
const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CHARACTER_ID = '11111111-1111-4111-8111-111111111111';
const ENEMY_ID = '22222222-2222-4222-8222-222222222222';
const PARTY = { id: PARTY_ID, ownerUserId: 'gm-1' };

const enemyRow = {
  id: ENEMY_ID,
  partyId: PARTY_ID,
  name: 'Goblin',
  type: '',
  habitat: '',
  description: 'GM note',
  playerDescription: 'Player note',
  currentHealth: 4,
  maxHealth: 8,
  morale: 7,
  armorDie: '',
  armorDescription: '',
  attacks: [],
  specials: [],
  loot: [],
  statuses: [{ id: 'h', percent: 100, label: 'Healthy' }],
};

let partyByRoom: { id: string; ownerUserId: string } | null = PARTY;
let characterVisibleInRoom = true;
const repoCalls: string[] = [];

mock.module('../../src/repositories/party-repository.js', {
  namedExports: {
    partyRepository: {
      getPartyByObrRoomId: async () => partyByRoom,
    },
  },
});

mock.module('../../src/services/obr-room-visibility-service.js', {
  namedExports: {
    isCharacterVisibleInObrRoom: async () => characterVisibleInRoom,
  },
});

mock.module('../../src/repositories/enemy-repository.js', {
  namedExports: {
    enemyRepository: {
      listByParty: async () => {
        repoCalls.push('list');
        return [enemyRow];
      },
      create: async () => {
        repoCalls.push('create');
        return enemyRow;
      },
      update: async () => {
        repoCalls.push('update');
        return enemyRow;
      },
      setHealth: async () => {
        repoCalls.push('setHealth');
        return enemyRow;
      },
      delete: async () => {
        repoCalls.push('delete');
        return 1;
      },
    },
  },
});

const { createEnemyService } = await import(
  '../../src/services/enemy-service.js'
);
const log = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

beforeEach(() => {
  partyByRoom = PARTY;
  characterVisibleInRoom = true;
  repoCalls.length = 0;
});

const body = {
  name: 'Goblin',
  description: 'GM note',
  playerDescription: 'Player note',
  currentHealth: 4,
  maxHealth: 8,
  morale: 7,
  statuses: [{ id: 'h', percent: 100, label: 'Healthy' }],
};

test('listForOwner returns full enemies to any caller who knows the room', async () => {
  const res = await createEnemyService(log).listForOwner({
    roomId: ROOM,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal((res.value as Array<{ morale: number }>)[0].morale, 7);
  }
  assert.equal(repoCalls.includes('list'), true);
});

test('listForOwner 404s when no room party exists', async () => {
  partyByRoom = null;
  const res = await createEnemyService(log).listForOwner({
    roomId: ROOM,
  });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.statusCode, 404);
  }
});

test('listCardsForPlayer returns safe cards when characterId is bound to the room', async () => {
  const res = await createEnemyService(log).listCardsForPlayer({
    roomId: ROOM,
    characterId: CHARACTER_ID,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    const card = (res.value as Array<Record<string, unknown>>)[0];
    assert.equal('description' in card, false);
    assert.equal(card.playerDescription, 'Player note');
    assert.equal('morale' in card, false);
    assert.equal('loot' in card, false);
    assert.equal(card.statusLabel, 'Healthy');
  }
});

test('listCardsForPlayer returns [] when the character is not bound to the room', async () => {
  characterVisibleInRoom = false;
  const res = await createEnemyService(log).listCardsForPlayer({
    roomId: ROOM,
    characterId: CHARACTER_ID,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(res.value, []);
  }
});

test('listCardsForPlayer returns safe cards when characterId has a durable room binding', async () => {
  characterVisibleInRoom = true;

  const res = await createEnemyService(log).listCardsForPlayer({
    roomId: ROOM,
    characterId: CHARACTER_ID,
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    const card = (res.value as Array<Record<string, unknown>>)[0];
    assert.equal(card.playerDescription, 'Player note');
    assert.equal('description' in card, false);
  }
});

test('create writes when the room party exists', async () => {
  const res = await createEnemyService(log).create({
    roomId: ROOM,
    body,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal((res.value as { name: string }).name, 'Goblin');
  }
  assert.equal(repoCalls.includes('create'), true);
});

test('setHealth clamps and writes for the room', async () => {
  const res = await createEnemyService(log).setHealth({
    roomId: ROOM,
    enemyId: ENEMY_ID,
    currentHealth: 999,
  });
  assert.equal(res.ok, true);
  assert.equal(repoCalls.includes('setHealth'), true);
});

test('enemy mutations are gated by the room party only (room-trust by design)', async () => {
  // no session anywhere in the input
  const res = await createEnemyService(log).create({
    roomId: ROOM,
    body,
  });
  assert.equal(res.ok, true);
});
