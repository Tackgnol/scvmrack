import { describe, expect, test } from 'vitest';

import {
  buildCustomItemBundle,
  collectKnownAmmoTypes,
  createUsePips,
} from '../../../src/inventory/customItems';
import { type Character } from '../../../src/hooks/models';

const stats = {
  agility: 10,
  strength: 10,
  presence: 14,
  toughness: 10,
};

describe('custom item factory', () => {
  test('builds a plain custom item with value and quantity', () => {
    const items = buildCustomItemBundle(
      {
        kind: 'misc',
        name: 'Caught butterfly worth 6s',
        value: 6,
        quantity: 2,
      },
      stats,
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      source: 'custom',
      category: 'misc',
      name: 'Caught butterfly worth 6s',
      value: 6,
      tags: ['custom'],
    });
    expect(items[0].key).toMatch(/^custom\.misc\./);
  });

  test('builds an ammo weapon and a single ammo stack', () => {
    const items = buildCustomItemBundle(
      {
        kind: 'weapon',
        name: 'Skull bow',
        damageDie: 6,
        ammoType: 'Bone arrow',
        ammoAmount: 3,
        modifier: {
          enabled: true,
          value: -1,
          statistic: 'presence',
          scope: 'ranged',
        },
      },
      stats,
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      category: 'weapon',
      tags: ['custom', 'weapon'],
      dice: [6],
      ammoType: 'Bone arrow',
      modifiers: [
        {
          value: -1,
          statistic: 'presence',
          exclude: ['melee', 'defence', 'cast', 'ability'],
        },
      ],
    });
    expect(items[1]).toMatchObject({
      category: 'ammo',
      tags: ['custom', 'ammo'],
      ammoType: 'Bone arrow',
      amount: 3,
    });
  });

  test('builds armor with preset die/tier and no hidden modifiers', () => {
    const [armor] = buildCustomItemBundle(
      {
        kind: 'armor',
        name: 'Rust saint plate',
        armorPreset: 'heavy',
      },
      stats,
    );

    expect(armor).toMatchObject({
      category: 'armor',
      tags: ['custom', 'armor', 'heavy-armor'],
      dice: [6],
      maxTier: 3,
      currentTier: 3,
    });
    expect(armor.modifiers).toEqual([]);
  });

  test('builds armor with the user-supplied modifier', () => {
    const [armor] = buildCustomItemBundle(
      {
        kind: 'armor',
        name: 'Rust saint plate',
        armorPreset: 'heavy',
        modifier: {
          enabled: true,
          value: -2,
          statistic: 'agility',
          scope: 'all',
        },
      },
      stats,
    );

    expect(armor.modifiers).toHaveLength(1);
    expect(armor.modifiers?.[0]).toMatchObject({
      source: 'Rust saint plate',
      statistic: 'agility',
      value: -2,
      exclude: [],
    });
  });

  test('builds consumable uses from fixed plus stat modifier', () => {
    const [item] = buildCustomItemBundle(
      {
        kind: 'consumable',
        name: 'Lantern mites',
        useCountRule: {
          mode: 'fixedPlusModifier',
          base: 4,
          statistic: 'presence',
        },
      },
      stats,
    );

    expect(item.uses).toHaveLength(5);
    expect(item.uses).toEqual([false, false, false, false, false]);
  });

  test('collects known ammo types from character gear', () => {
    const character: Character = {
      equipment: [{ name: 'Quarrels', ammoType: 'Bolt' }],
      storage: [{ name: 'Needles', ammoType: 'Needle' }],
      equippedWeapons: [{ name: 'Bow', ammoType: 'Arrow' }],
    };

    expect(collectKnownAmmoTypes(character)).toEqual([
      'Arrow',
      'Bolt',
      'Needle',
    ]);
  });

  test('createUsePips honors fixed mode', () => {
    expect(createUsePips({ mode: 'fixed', base: 3 }, stats)).toHaveLength(3);
  });

  test('quantity copies get independent modifier and uses arrays', () => {
    const items = buildCustomItemBundle(
      {
        kind: 'misc',
        name: 'Charm of poor decisions',
        quantity: 3,
        modifier: {
          enabled: true,
          value: -1,
          statistic: 'presence',
          scope: 'all',
        },
      },
      stats,
    );

    expect(items).toHaveLength(3);
    expect(items[0].modifiers).not.toBe(items[1].modifiers);
    expect(items[1].modifiers).not.toBe(items[2].modifiers);
    expect(items[0].modifiers?.[0].id).not.toBe(items[1].modifiers?.[0].id);

    const consumables = buildCustomItemBundle(
      {
        kind: 'consumable',
        name: 'Lantern mites',
        quantity: 2,
        useCountRule: { mode: 'fixed', base: 3 },
      },
      stats,
    );

    expect(consumables[0].uses).not.toBe(consumables[1].uses);
    expect(consumables[0].key).not.toBe(consumables[1].key);
  });
});
