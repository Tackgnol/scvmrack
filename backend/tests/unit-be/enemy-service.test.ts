import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';

type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

const ROOM = 'room-1';
const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CHARACTER_ID = '11111111-1111-4111-8111-111111111111';
const ENEMY_ID = '22222222-2222-4222-8222-222222222222';
const PARTY = { id: PARTY_ID, ownerUserId: 'gm-1' };
const GM: AppSession = {
  session: { id: 's' },
  user: { id: 'gm-1', isAnonymous: false },
};
const OTHER: AppSession = {
  session: { id: 's2' },
  user: { id: 'gm-2', isAnonymous: false },
};

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
let idsInRoom: string[] = [CHARACTER_ID];
const repoCalls: string[] = [];

mock.module('../../src/repositories/party-repository.js', {
  namedExports: {
    partyRepository: {
      getPartyByObrRoomId: async () => partyByRoom,
    },
  },
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      filterIdsInRoom: async () => idsInRoom,
    },
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
  idsInRoom = [CHARACTER_ID];
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

test('listForOwner returns full enemies to the room party owner', async () => {
  const res = await createEnemyService(log).listForOwner({
    session: GM,
    roomId: ROOM,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal((res.value as Array<{ morale: number }>)[0].morale, 7);
  }
});

test('listForOwner 404s a non-owner', async () => {
  const res = await createEnemyService(log).listForOwner({
    session: OTHER,
    roomId: ROOM,
  });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.statusCode, 404);
  }
});

test('listForOwner 401s an anonymous caller', async () => {
  const res = await createEnemyService(log).listForOwner({
    session: {
      session: { id: 'a' },
      user: { id: 'anon', isAnonymous: true },
    },
    roomId: ROOM,
  });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.statusCode, 401);
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
  idsInRoom = [];
  const res = await createEnemyService(log).listCardsForPlayer({
    roomId: ROOM,
    characterId: CHARACTER_ID,
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(res.value, []);
  }
});

test('create rejects a non-owner before writing', async () => {
  const res = await createEnemyService(log).create({
    session: OTHER,
    roomId: ROOM,
    body,
  });
  assert.equal(res.ok, false);
  assert.equal(repoCalls.includes('create'), false);
});

test('setHealth clamps and writes for the owner', async () => {
  const res = await createEnemyService(log).setHealth({
    session: GM,
    roomId: ROOM,
    enemyId: ENEMY_ID,
    currentHealth: 999,
  });
  assert.equal(res.ok, true);
  assert.equal(repoCalls.includes('setHealth'), true);
});
