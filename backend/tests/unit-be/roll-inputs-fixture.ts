import { ABILITY_STATS } from '../../src/lib/ability-modifiers.js';
import type { ClassSpec, RollTables, StatDice } from '../../src/lib/generate-character.js';

/** Plain 3d6 per stat, plus the given per-stat modifiers. */
export function bookStatDice(modifiers: Record<string, number> = {}): ClassSpec['statDice'] {
  return Object.fromEntries(
    ABILITY_STATS.map((stat) => [
      stat,
      { count: 3, faces: 6, modifier: modifiers[stat] ?? 0, dropLowest: false } satisfies StatDice,
    ])
  ) as ClassSpec['statDice'];
}

/** A small catalog with the rows the scripted rolls below land on. */
export function baseTables(): RollTables {
  return {
    names: ['Ash', 'Bora'],
    weapons: [
      { key: 'weapons.shortbow', tags: ['weapon', 'ranged'], roll: 4, ammoType: 'Arrow', defaultAmount: 6 },
      { key: 'weapons.crossbow', tags: ['weapon', 'ranged'], roll: 6, ammoType: 'Bolt', defaultAmount: 2 },
    ],
    armors: [
      { key: 'armor.light', tags: ['armor'], maxTier: 1, classId: null },
      { key: 'armor.mail', tags: ['armor'], maxTier: 2, classId: null },
    ],
    equipment: [
      { key: 'equipment.backpack', tags: ['carry'], defaultAmount: null, classId: null },
      { key: 'equipment.torches', tags: ['light'], defaultAmount: null, classId: null },
      { key: 'equipment.life-elixir', tags: ['consumable'], defaultAmount: null, classId: null },
      { key: 'equipment.arrows', tags: ['ammo'], defaultAmount: null, classId: null },
      { key: 'equipment.bolts', tags: ['ammo'], defaultAmount: null, classId: null },
      { key: 'equipment.lockpicks', tags: ['tool'], defaultAmount: null, classId: null },
      { key: 'equipment.tent', tags: ['shelter'], defaultAmount: null, classId: null },
      { key: 'scroll.unclean.one', tags: ['scroll', 'unclean'], defaultAmount: null, classId: null },
      { key: 'scroll.unclean.two', tags: ['scroll', 'unclean'], defaultAmount: null, classId: null },
      { key: 'scroll.sacred.one', tags: ['scroll', 'sacred'], defaultAmount: null, classId: null },
    ],
    pets: [],
    habits: ['habit.one', 'habit.two'],
    tales: ['tale.one'],
    bodyDescriptions: ['body.one'],
    traits: ['trait.one', 'trait.two', 'trait.three'],
  };
}

/** Class 1: a Book Class with one fixed ability and one random ability that grants lockpicks. */
export function bookClassSpec(): ClassSpec {
  return {
    hpDie: 8,
    silverDice: [6, 6],
    silverModifier: 10,
    weaponDie: 10,
    armorDie: 4,
    statDice: bookStatDice({ strength: 2, agility: -1 }),
    omenDie: 2,
    originKeys: ['origin.one', 'origin.two'],
    abilities: [
      { id: 1, key: 'abilities.fixed', isRandom: false, position: 1, grantItemKey: null, grantPetKey: null },
      {
        id: 2,
        key: 'abilities.random-lockpicks',
        isRandom: true,
        position: 2,
        grantItemKey: 'equipment.lockpicks',
        grantPetKey: null,
      },
    ],
    randomAbilityCount: 1,
  };
}
