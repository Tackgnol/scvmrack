/**
 * The Custom Class draft: the one shape the creator edits, autosaves, test-rolls and saves.
 * Holds its types, the value lists the API schema accepts, the editing limits, the blank draft,
 * the save checks (`classDraftProblems`) and the conversion to the generator's `ClassSpec`.
 * Language and stat lists come from the app-wide definitions; nothing here re-declares them.
 */
import { SUPPORTED_LOCALES, type SupportedLocale } from '../config/locales.js';
import { ABILITY_STATS, type AbilityStat } from './ability-modifiers.js';
import type { GettingBetterRule } from './class-model.js';
import { CLASSLESS_DEFAULTS, type ClassSpec, type StatDice } from './generate-character.js';
import type { FromSchema } from 'json-schema-to-ts';
import type { ClassDraftSchema } from '../schemas/custom-class.js';

export type Localized = Record<SupportedLocale, string>;
/** An origin's text; a saved origin carries its translation key so edits keep it stable. */
export type OriginText = Localized & { key?: string };


export const LIMIT_LIST = 20;
export const LIMIT_TEXT = 1500;
export const LIMIT_NAME = 100;

/** Dice an ability's reference table can use; the table has one row per face. */
export const TABLE_DICE = [2, 3, 4, 6, 8, 10, 12] as const;
export type TableDie = (typeof TABLE_DICE)[number];
/** Dice a weapon, gear effect or hit points can roll. */
export const DIE_FACES = [2, 4, 6, 8, 10, 12] as const;
/** Dice a stat can roll. */
export const STAT_DIE_FACES = [4, 6, 8, 10, 12] as const;
/** Dice the omen roll can use. */
export const OMEN_DICE = [2, 4, 6] as const;
/** Dice a starting weapon roll can use. */
export const WEAPON_DICE = [4, 6, 8, 10] as const;
/** Dice a starting armor roll can use. */
export const ARMOR_DICE = [2, 3, 4] as const;
/** Dice the starting silver roll can use. */
export const SILVER_DICE = [4, 6] as const;
/** Dice a pet's action can roll. */
export const PET_ACTION_DICE = [2, 4, 6, 8, 10] as const;
/** Armor tiers: light, medium, heavy. */
export const ARMOR_TIERS = [1, 2, 3] as const;

export const CLASS_ITEM_TYPES = ['weapon', 'armor', 'gear', 'pet'] as const;
export type ClassItemType = (typeof CLASS_ITEM_TYPES)[number];
export const WEAPON_REACHES = ['melee', 'ranged'] as const;
export const WEAPON_AMMO = ['none', 'counted', 'endless'] as const;
export const GEAR_KINDS = ['consumable', 'wearable', 'carried'] as const;
export const GEAR_EFFECTS = ['text', 'damage', 'die'] as const;
export const PET_ACTIONS = ['attack', 'buff'] as const;

/**
 * A Custom Class as the creator edits it, and as it is sent to save or test-roll.
 * Derived from the request schema, so the type and the validation can't drift.
 */
export type ClassDraft = FromSchema<typeof ClassDraftSchema>;
/** An ability as the creator edits it; a saved one carries its key, kept stable across edits. */
export type AbilityDraft = ClassDraft['abilities'][number];
/** A stat modifier an ability carries; `exclude` names the rolls it doesn't apply to, as the sheet stores it. */
export type AbilityModifierDraft = AbilityDraft['modifiers'][number];
export type AbilityTableDraft = NonNullable<AbilityDraft['table']>;
export type AbilityTableRowDraft = AbilityTableDraft['rows'][number];
/**
 * A Class Item as the creator edits it. `ref` is its saved key, or a `new:` id
 * until saved. Every type's fields are kept, so changing type loses nothing.
 */
export type ClassItemDraft = ClassDraft['items'][number];

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  pl: 'Polish',
};
const empty = (): Localized => ({ en: '', pl: '' });
const bookStat = (): ClassDraft['stats'][AbilityStat] => ({
  count: 3,
  faces: 6,
  modifier: 0,
  dropLowest: false,
});

/** A new class: the book's defaults, no text yet. */
export function blankClassDraft(): ClassDraft {
  return {
    languages: ['en'],
    name: empty(),
    description: empty(),
    stats: {
      strength: bookStat(),
      agility: bookStat(),
      presence: bookStat(),
      toughness: bookStat(),
    },
    hpDie: CLASSLESS_DEFAULTS.hpDie,
    omenDie: CLASSLESS_DEFAULTS.omenDie,
    weaponDie: CLASSLESS_DEFAULTS.weaponDie,
    armorDie: CLASSLESS_DEFAULTS.armorDie,
    silver: {
      count: CLASSLESS_DEFAULTS.silverDice.length,
      faces: CLASSLESS_DEFAULTS.silverDice[0],
      multiplier: CLASSLESS_DEFAULTS.silverModifier,
    },
    origins: [],
    abilities: [],
    randomAbilityCount: 0,
    items: [],
    gettingBetterRule: 'book',
    gettingBetterNote: empty(),
  };
}

/** A new Class Item of a type, with the book's usual numbers and no text yet. */
export function blankClassItem(type: ClassItemType): ClassItemDraft {
  return {
    ref: 'new:item',
    type,
    name: empty(),
    description: empty(),
    value: 0,
    weapon: {
      diceCount: 1,
      diceFaces: 6,
      damageModifier: 0,
      reach: 'melee',
      ammo: 'none',
      ammoCount: 10,
      ammoName: '',
      modifiers: [],
    },
    armor: { tier: 1, modifiers: [] },
    gear: {
      kind: 'carried',
      uses: 0,
      effect: 'text',
      effectDie: 6,
      statuses: [],
    },
    pet: { hp: 4, actionDie: 4, action: 'attack', humanoid: false, buffs: [] },
  };
}

/** What stops a draft from saving, as sentences a GM reads. Ranges and caps are the route schema's job. */
export function classDraftProblems(draft: ClassDraft): string[] {
  const problems: string[] = [];
  const text = (value: Localized, where: string) => {
    for (const language of draft.languages) {
      if (!value[language]?.trim()) {
        problems.push(`${LANGUAGE_NAMES[language]} missing: ${where}`);
      }
    }
  };
  text(draft.name, 'class name');
  text(draft.description, 'class description');
  draft.origins.forEach((origin, i) => text(origin, `origin ${i + 1}`));
  if (draft.origins.length === 0) {
    problems.push('Add at least one origin');
  }
  for (const stat of ABILITY_STATS) {
    const dice = draft.stats[stat];
    if (dice.dropLowest && dice.count < 2) {
      problems.push(
        `${stat} can drop its lowest die only when it rolls two or more`
      );
    }
  }
  draft.abilities.forEach((ability, i) => {
    text(ability.name, `ability ${i + 1} name`);
    text(ability.text, `ability ${i + 1} rules text`);
    const seen = new Set<string>();
    if (ability.table) {
      if (ability.table.rows.length !== ability.table.die) {
        problems.push(`Ability “${ability.name[draft.languages[0]] || i + 1}” needs ${ability.table.die} table rows`);
      }
      ability.table.rows.forEach((row, roll) =>
        text(row.text, `ability ${i + 1} table row ${roll + 1}`)
      );
    }
    for (const modifier of ability.modifiers) {
      const id = JSON.stringify([
        modifier.statistic,
        modifier.value,
        [...modifier.exclude].sort(),
      ]);
      if (seen.has(id)) {
        problems.push(
          `Ability “${
            ability.name[draft.languages[0]] || i + 1
          }” has the same modifier twice`
        );
        break;
      }
      seen.add(id);
    }
  });
  const items = new Map(draft.items.map((item) => [item.ref, item]));
  const grants = new Map<string, number>();
  const nameOf = (value: Localized, fallback: string) =>
    value[draft.languages[0]]?.trim() || fallback;
  const seenItemRefs = new Set<string>();
  for (const item of draft.items) {
    if (seenItemRefs.has(item.ref)) {
      problems.push(
        `Class Item “${nameOf(
          item.name,
          'unnamed'
        )}” has the same reference as another Class Item`
      );
    }
    seenItemRefs.add(item.ref);
  }
  draft.abilities.forEach((ability, i) => {
    const who = nameOf(ability.name, `ability ${i + 1}`);
    for (const [slot, ref] of [
      ['item', ability.grantItem],
      ['pet', ability.grantPet],
    ] as const) {
      if (!ref) {
        continue;
      }
      const item = items.get(ref);
      if (!item && ref.startsWith('new:')) {
        problems.push(
          `Ability “${who}” grants an item that is not in this class`
        );
      } else if (item && (item.type === 'pet') !== (slot === 'pet')) {
        const what = item.type === 'pet' ? 'pet' : 'item';
        problems.push(
          `Ability “${who}” holds the ${what} “${nameOf(
            item.name,
            'unnamed'
          )}” in its ${slot} slot`
        );
      } else if (item) {
        grants.set(ref, (grants.get(ref) ?? 0) + 1);
      }
    }
    for (const [roll, row] of ability.table?.rows.entries() ?? []) {
      if (!row.itemRef) {
        continue;
      }
      const item = items.get(row.itemRef);
      if (!item) {
        problems.push(`Ability “${who}” table row ${roll + 1} grants an item that is not in this class`);
      } else {
        grants.set(row.itemRef, (grants.get(row.itemRef) ?? 0) + 1);
      }
    }
  });
  draft.items.forEach((item, i) => {
    text(item.name, `Class Item ${i + 1} name`);
    const what = nameOf(item.name, `${i + 1}`);
    const count = grants.get(item.ref) ?? 0;
    if (count === 0) {
      problems.push(`Class Item “${what}” is not granted by any ability`);
    }
    if (count > 1) {
      problems.push(`Class Item “${what}” is granted by more than one ability`);
    }
  });
  const pool = draft.abilities.filter((a) => a.random).length;
  if (draft.randomAbilityCount > pool) {
    problems.push(
      `Rolls ${draft.randomAbilityCount} random abilities, but the pool has ${pool}`
    );
  }
  if (
    draft.gettingBetterRule === 'specialist' &&
    pool < draft.randomAbilityCount + 1
  ) {
    problems.push(
      'Specialist needs at least one more random ability than each scvm rolls'
    );
  }
  return problems;
}

/** The generator's view of a draft. Origins and abilities are their text in `language`, standing in for keys. */
export function classSpecFromDraft(
  draft: ClassDraft,
  language: SupportedLocale
): ClassSpec {
  const textIn = (value: Localized) =>
    value[language] || value[draft.languages[0]];
  // Unsaved Class Items have no catalog row yet; a test scvm carries them by name.
  const itemName = (ref: string | null) => {
    const item = ref ? draft.items.find((i) => i.ref === ref) : undefined;
    return item ? textIn(item.name) : ref;
  };
  return {
    hpDie: draft.hpDie,
    omenDie: draft.omenDie,
    weaponDie: draft.weaponDie,
    armorDie: draft.armorDie,
    silverDice: Array.from(
      { length: draft.silver.count },
      () => draft.silver.faces
    ),
    silverModifier: draft.silver.multiplier,
    statDice: draft.stats,
    originKeys: draft.origins.map(textIn),
    abilities: draft.abilities.map((ability, i) => ({
      id: i,
      key: textIn(ability.name),
      isRandom: ability.random,
      position: i + 1,
      grantItemKey: itemName(ability.grantItem),
      grantPetKey: itemName(ability.grantPet),
      table: ability.table && {
        die: ability.table.die,
        rows: ability.table.rows.map((row) => ({
          text: textIn(row.text),
          itemKey: itemName(row.itemRef),
        })),
      },
    })),
    randomAbilityCount: draft.randomAbilityCount,
  };
}
