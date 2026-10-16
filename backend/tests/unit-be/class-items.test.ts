import assert from 'node:assert/strict';
import test from 'node:test';

import {
  blankClassItem,
  type ClassItemDraft,
} from '../../src/lib/class-draft.ts';
import {
  itemFromRow,
  itemRow,
  itemTypeOf,
  stableItemKeys,
} from '../../src/lib/class-items.ts';

const named = (item: ClassItemDraft): ClassItemDraft => ({
  ...item,
  name: { en: 'X', pl: '' },
});

test('items keep their key while their type stays; new and retyped ones get unused numbers', () => {
  const keys = stableItemKeys(
    7,
    [
      { ref: 'weapons.cc-7-1', type: 'weapon' },
      { ref: 'weapons.cc-7-2', type: 'pet' },
      { ref: 'new:a', type: 'gear' },
    ],
    ['weapons.cc-7-1', 'weapons.cc-7-2', 'armor.cc-7-5']
  );
  assert.deepEqual(keys, ['weapons.cc-7-1', 'pets.cc-7-6', 'equipment.cc-7-7']);
  assert.equal(itemTypeOf('pets.cc-7-6'), 'pet');
  assert.equal(itemTypeOf('weapons.brown-scimitar'), null);
});

test('every type survives a save and a reload', () => {
  const weapon = named(blankClassItem('weapon'));
  weapon.weapon = {
    ...weapon.weapon,
    diceCount: 2,
    diceFaces: 4,
    damageModifier: 1,
    reach: 'ranged',
    ammo: 'counted',
    ammoCount: 12,
    ammoName: 'Bone darts',
    modifiers: [{ statistic: 'presence', value: -1, exclude: ['melee'] }],
  };
  const armor = named(blankClassItem('armor'));
  armor.armor = {
    tier: 3,
    modifiers: [{ statistic: 'agility', value: -2, exclude: [] }],
  };
  const gear = named(blankClassItem('gear'));
  gear.gear = {
    kind: 'consumable',
    uses: 3,
    effect: 'die',
    effectDie: 4,
    statuses: [
      {
        statistic: 'agility',
        value: -2,
        exclude: ['ability', 'heal', 'ranged', 'melee', 'cast'],
      },
    ],
  };
  const pet = named(blankClassItem('pet'));
  pet.pet = {
    hp: 3,
    actionDie: 6,
    action: 'buff',
    humanoid: true,
    buffs: [{ statistic: 'strength', value: 1, exclude: [] }],
  };

  for (const item of [weapon, armor, gear, pet]) {
    const { data } = itemRow({ ...item, value: 15 }, 7, 'X', 1);
    const back = itemFromRow(
      item.type,
      { key: 'k', ...data } as never,
      item.name,
      item.description
    );
    assert.deepEqual(
      { ...back, ref: item.ref },
      { ...item, value: 15 },
      item.type
    );
  }
});

test('stored rows read the way the sheet and generator expect', () => {
  const sword = named(blankClassItem('weapon'));
  sword.weapon = { ...sword.weapon, diceCount: 2, diceFaces: 4 };
  assert.deepEqual(itemRow(sword, 7, 'X', 1).data.dice, [4, 4]);
  const plate = named(blankClassItem('armor'));
  plate.armor = { tier: 2, modifiers: [] };
  assert.deepEqual(itemRow(plate, 7, 'X', 1).data, {
    classId: 7,
    value: 0,
    position: 1,
    tags: ['armor', 'medium-armor'],
    dice: [4],
    maxTier: 2,
    modifiers: [],
  });
});
