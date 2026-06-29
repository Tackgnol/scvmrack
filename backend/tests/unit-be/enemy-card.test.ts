import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_ENEMY_STATUS_BANDS,
  resolveEnemyStatusLabel,
  toEnemyCard,
  toEnemyFull,
} from '../../src/lib/enemy-card.js';

const row = {
  id: 'e1',
  partyId: 'p1',
  name: 'Goblin',
  type: 'Beast',
  habitat: 'Swamp',
  description: 'GM eyes only',
  playerDescription: 'Nasty',
  currentHealth: 3,
  maxHealth: 8,
  morale: 7,
  armorDie: '-d2',
  armorDescription: 'Rags',
  attacks: [{ id: 'a1', name: 'Bite', die: 'd4' }],
  specials: [{ id: 's1', name: 'Sneak', description: 'hides' }],
  loot: [{ id: 'l1', label: 'Teeth', value: '2sp' }],
  statuses: DEFAULT_ENEMY_STATUS_BANDS,
};

test('toEnemyCard exposes only safe fields with a resolved status label', () => {
  const card = toEnemyCard(row);
  assert.deepEqual(card, {
    id: 'e1',
    name: 'Goblin',
    type: 'Beast',
    habitat: 'Swamp',
    playerDescription: 'Nasty',
    healthPercent: 38,
    statusId: 'severely-wounded',
    statusLabel: 'Severely wounded',
  });
  assert.equal('description' in card, false);
  assert.equal('morale' in card, false);
  assert.equal('loot' in card, false);
  assert.equal('attacks' in card, false);
  assert.equal('maxHealth' in card, false);
});

test('toEnemyFull keeps every field and coerces JSON arrays', () => {
  const full = toEnemyFull(row);
  assert.equal(full.morale, 7);
  assert.equal(full.description, 'GM eyes only');
  assert.equal(full.playerDescription, 'Nasty');
  assert.equal(full.currentHealth, 3);
  assert.equal(full.healthPercent, 38);
  assert.equal(full.attacks[0]?.name, 'Bite');
  assert.equal(full.loot.length, 1);
});

test('resolveEnemyStatusLabel picks the lowest band at or above health', () => {
  assert.equal(
    resolveEnemyStatusLabel(100, DEFAULT_ENEMY_STATUS_BANDS),
    'Healthy'
  );
  assert.equal(
    resolveEnemyStatusLabel(10, DEFAULT_ENEMY_STATUS_BANDS),
    "At death's door"
  );
});
