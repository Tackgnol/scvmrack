import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCharacterCard } from '../../src/lib/character-card.js';
import type { CharacterSheet } from '../../src/schemas/character.js';

const full: CharacterSheet = {
  id: 'c1', name: 'Karg', classId: 3, className: 'Hermetyczny pustelnik', classDescription: null,
  classAttribution: null, classAuthoredLanguage: null, classContentRemoved: false, classReportable: true, classCustom: false,
  strength: 13, agility: 8, presence: 11, toughness: 10,
  currentHp: 2, maxHp: 2, omens: 2, maxOmens: 2, silver: 10,
  drToDodge: 14, drToMelee: 10, drToRanged: 11,
  encumbrance: 1, maxEncumbrance: 9,
  abilities: [{ key: 'abilities.secret', name: 'Secret', description: 'GM eyes only' }],
  equippedWeapons: [{ name: 'Kostur', dice: [4] }],
  equippedArmor: {},
  modifiers: [{ value: 1, statistic: 'strength', source: 'Grip' }],
  computedModifiers: [],
  bodyDescription: 'gaunt', habit: 'addict', tale: 'saw the end', origin: 'gutter-born',
  trait1: 'grim', trait2: 'patient',
  // Carried inventory: narrowed to name + description; the no-name entry drops.
  equipment: [
    { name: 'Rope', description: '15 ft', key: 'equipment.rope', modifiers: [{ value: 1 }], tags: ['gear'] },
    { key: 'weapon.dagger' },
  ],
  // fields that MUST NOT leak:
  notes: 'secret GM note', storage: [{ key: 'equipment.gold' }],
  miseryCount: 0, partyId: null, joinedAt: null,
  createdAt: '2026-03-01T10:00:00.000Z', updatedAt: '2026-03-02T11:00:00.000Z',
};

test('toCharacterCard projects the table-visible card fields', () => {
  assert.deepEqual(toCharacterCard(full), {
    id: 'c1', name: 'Karg', className: 'Hermetyczny pustelnik',
    currentHp: 2, maxHp: 2,
    strength: 13, agility: 8, presence: 11, toughness: 10,
    drToDodge: 14, drToMelee: 10, drToRanged: 11,
    omens: 2, maxOmens: 2, silver: 10,
    equippedWeapons: [{ name: 'Kostur', dice: [4] }],
    equippedArmor: { name: null },
    equipment: [{ name: 'Rope', description: '15 ft' }],
    computedModifiers: [],
    bodyDescription: 'gaunt', habit: 'addict', origin: 'gutter-born',
    trait1: 'grim', trait2: 'patient',
  });
});

test('toCharacterCard keeps the card field order the room-card route sends', () => {
  assert.deepEqual(Object.keys(toCharacterCard(full)), [
    'id', 'name', 'className', 'currentHp', 'maxHp', 'strength', 'agility', 'presence', 'toughness',
    'drToDodge', 'drToMelee', 'drToRanged', 'omens', 'maxOmens', 'silver', 'equippedWeapons',
    'equippedArmor', 'equipment', 'computedModifiers', 'bodyDescription', 'habit', 'origin', 'trait1', 'trait2',
  ]);
});

test('toCharacterCard narrows weapon/armor sub-fields', () => {
  const card = toCharacterCard({
    ...full,
    equippedWeapons: [
      { name: 'Sword', dice: [6], key: 'weapon.sword', modifiers: [{ value: 1 }], value: 50, tags: ['melee'] },
      { key: 'weapon.unnamed' },
    ],
    equippedArmor: { name: 'Mail', dice: [4], key: 'armor.mail', tags: ['armor'], modifiers: [{ value: -2 }], maxTier: 3, currentTier: 2 },
  });
  assert.deepEqual(card.equippedWeapons, [{ name: 'Sword', dice: [6] }, { name: null, dice: [] }]);
  assert.deepEqual(card.equippedArmor, {
    name: 'Mail',
    dice: [4],
    currentTier: 2,
    maxTier: 3,
  });
  assert.deepEqual(Object.keys(card.equippedArmor), ['name', 'dice', 'currentTier', 'maxTier']);
});

test('toCharacterCard shows an empty armor slot by name only', () => {
  assert.deepEqual(toCharacterCard({ ...full, equippedArmor: null }).equippedArmor, { name: null });
});

test('toCharacterCard exposes equipment narrowed to name + description only', () => {
  const card = toCharacterCard(full);
  const item = card.equipment[0] as Record<string, unknown>;
  // No raw item internals (key/modifiers/tags) leak through.
  assert.deepEqual(Object.keys(item).sort(), ['description', 'name']);
});

test('toCharacterCard never leaks private fields', () => {
  const card = toCharacterCard(full) as unknown as Record<string, unknown>;
  for (const field of ['notes', 'storage', 'abilities', 'modifiers', 'tale', 'partyId']) {
    assert.ok(!(field in card), field);
  }
});
