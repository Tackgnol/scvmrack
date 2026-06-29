import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCharacterCard } from '../../src/lib/character-card.js';

const full = {
  id: 'c1', name: 'Karg', className: 'Hermetyczny pustelnik',
  strength: 13, agility: 8, presence: 11, toughness: 10,
  currentHp: 2, maxHp: 2, omens: 2, maxOmens: 2, silver: 10,
  drToDodge: 14, drToMelee: 10, drToRanged: 11,
  equippedWeapons: [{ name: 'Kostur', dice: [4] }],
  equippedArmor: { name: null },
  computedModifiers: [],
  bodyDescription: 'gaunt', habit: 'addict', origin: 'gutter-born',
  trait1: 'grim', trait2: 'patient',
  // Carried inventory: narrowed to name + description; the no-name entry drops.
  equipment: [
    { name: 'Rope', description: '15 ft', key: 'equipment.rope', modifiers: [{ value: 1 }], tags: ['gear'] },
    { key: 'weapon.dagger' },
  ],
  // fields that MUST NOT leak:
  notes: 'secret GM note', storage: [{ key: 'equipment.gold' }],
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

test('toCharacterCard narrows weapon/armor sub-fields', () => {
  const card = toCharacterCard({
    equippedWeapons: [{ name: 'Sword', dice: [6], key: 'weapon.sword', modifiers: [{ value: 1 }], value: 50, tags: ['melee'] }],
    equippedArmor: { name: 'Mail', dice: [4], key: 'armor.mail', tags: ['armor'], modifiers: [{ value: -2 }], maxTier: 3, currentTier: 2 },
  } as Record<string, unknown>);
  assert.deepEqual(card.equippedWeapons, [{ name: 'Sword', dice: [6] }]);
  assert.deepEqual(card.equippedArmor, {
    name: 'Mail',
    dice: [4],
    currentTier: 2,
    maxTier: 3,
  });
  assert.deepEqual(Object.keys(card.equippedArmor).sort(), ['currentTier', 'dice', 'maxTier', 'name']);
});

test('toCharacterCard exposes equipment narrowed to name + description only', () => {
  const card = toCharacterCard(full);
  const item = card.equipment[0] as Record<string, unknown>;
  // No raw item internals (key/modifiers/tags) leak through.
  assert.deepEqual(Object.keys(item).sort(), ['description', 'name']);
});

test('toCharacterCard never leaks private fields', () => {
  const card = toCharacterCard(full) as Record<string, unknown>;
  assert.ok(!('notes' in card));
  assert.ok(!('storage' in card));
});
