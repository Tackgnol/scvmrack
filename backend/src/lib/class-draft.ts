import type { GettingBetterRule } from './getting-better-types.js';
import type { ClassSpec, StatDice } from './generate-character.js';

export const CLASS_LANGUAGES = ['en', 'pl'] as const;
export type ClassLanguage = (typeof CLASS_LANGUAGES)[number];
export type Localized = Record<ClassLanguage, string>;
/** An origin's text; a saved origin carries its translation key so edits keep it stable. */
export type OriginText = Localized & { key?: string };

export const CLASS_STATS = [
  'strength',
  'agility',
  'presence',
  'toughness',
] as const;
export type ClassStat = (typeof CLASS_STATS)[number];

export const LIMIT_LIST = 20;
export const LIMIT_TEXT = 1500;
export const LIMIT_NAME = 100;

/** A stat modifier an ability carries; `exclude` names the rolls it doesn't apply to, as the sheet stores it. */
export type AbilityModifierDraft = {
  statistic: ClassStat;
  value: number;
  exclude: string[];
};

export type AbilityTableRowDraft = {
  text: Localized;
  itemRef: string | null;
};

export type AbilityTableDraft = {
  die: 2 | 3 | 4 | 6 | 8 | 10 | 12;
  rows: AbilityTableRowDraft[];
};

/** An ability as the creator edits it; a saved one carries its key, kept stable across edits. */
export type AbilityDraft = {
  key?: string;
  random: boolean;
  name: Localized;
  text: Localized;
  modifiers: AbilityModifierDraft[];
  /** A Class Item or shared catalog item (not a pet) it grants, by key or `ref`. */
  grantItem: string | null;
  /** A pet Class Item or shared catalog pet it grants, by key or `ref`. */
  grantPet: string | null;
  table: AbilityTableDraft | null;
};

export const CLASS_ITEM_TYPES = ['weapon', 'armor', 'gear', 'pet'] as const;
export type ClassItemType = (typeof CLASS_ITEM_TYPES)[number];

/**
 * A Class Item as the creator edits it. `ref` is its saved key, or a `new:` id
 * until saved. Every type's fields are kept, so changing type loses nothing.
 */
export type ClassItemDraft = {
  ref: string;
  type: ClassItemType;
  name: Localized;
  description: Localized;
  value: number;
  weapon: {
    diceCount: number;
    diceFaces: number;
    damageModifier: number;
    reach: 'melee' | 'ranged';
    ammo: 'none' | 'counted' | 'endless';
    ammoCount: number;
    ammoName: string;
    modifiers: AbilityModifierDraft[];
  };
  armor: { tier: number; modifiers: AbilityModifierDraft[] };
  gear: {
    kind: 'consumable' | 'wearable' | 'carried';
    uses: number;
    effect: 'text' | 'damage' | 'die';
    effectDie: number;
    statuses: AbilityModifierDraft[];
  };
  pet: {
    hp: number;
    actionDie: number;
    action: 'attack' | 'buff';
    humanoid: boolean;
    buffs: AbilityModifierDraft[];
  };
};

/** A Custom Class as the creator edits it, and as it is sent to save or test-roll. */
export type ClassDraft = {
  languages: ClassLanguage[];
  name: Localized;
  description: Localized;
  stats: Record<ClassStat, StatDice>;
  hpDie: number;
  omenDie: number;
  weaponDie: number;
  armorDie: number;
  silver: { count: number; faces: number; multiplier: number };
  origins: OriginText[];
  abilities: AbilityDraft[];
  randomAbilityCount: number;
  items: ClassItemDraft[];
  gettingBetterRule: GettingBetterRule;
  gettingBetterNote: Localized;
};

const LANGUAGE_NAMES: Record<ClassLanguage, string> = {
  en: 'English',
  pl: 'Polish',
};
const empty = (): Localized => ({ en: '', pl: '' });
const bookStat = (): StatDice => ({
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
    hpDie: 8,
    omenDie: 2,
    weaponDie: 10,
    armorDie: 4,
    silver: { count: 2, faces: 6, multiplier: 10 },
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
      if (!value[language]?.trim())
        problems.push(`${LANGUAGE_NAMES[language]} missing: ${where}`);
    }
  };
  text(draft.name, 'class name');
  text(draft.description, 'class description');
  draft.origins.forEach((origin, i) => text(origin, `origin ${i + 1}`));
  if (draft.origins.length === 0) problems.push('Add at least one origin');
  for (const stat of CLASS_STATS) {
    const dice = draft.stats[stat];
    if (dice.dropLowest && dice.count < 2)
      problems.push(
        `${stat} can drop its lowest die only when it rolls two or more`
      );
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
      if (!ref) continue;
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
      if (!row.itemRef) continue;
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
    if (count === 0)
      problems.push(`Class Item “${what}” is not granted by any ability`);
    if (count > 1)
      problems.push(`Class Item “${what}” is granted by more than one ability`);
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
  language: ClassLanguage
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
      position: i,
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
