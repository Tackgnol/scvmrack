import type { GettingBetterRule } from './getting-better-types.js';
import type { ClassSpec, StatDice } from './generate-character.js';

export const CLASS_LANGUAGES = ['en', 'pl'] as const;
export type ClassLanguage = (typeof CLASS_LANGUAGES)[number];
export type Localized = Record<ClassLanguage, string>;
/** An origin's text; a saved origin carries its translation key so edits keep it stable. */
export type OriginText = Localized & { key?: string };

export const CLASS_STATS = ['strength', 'agility', 'presence', 'toughness'] as const;
export type ClassStat = (typeof CLASS_STATS)[number];

export const LIMIT_LIST = 20;
export const LIMIT_TEXT = 1500;
export const LIMIT_NAME = 100;

/** A stat modifier an ability carries; `exclude` names the rolls it doesn't apply to, as the sheet stores it. */
export type AbilityModifierDraft = { statistic: ClassStat; value: number; exclude: string[] };

/** An ability as the creator edits it; a saved one carries its key, kept stable across edits. */
export type AbilityDraft = {
  key?: string;
  random: boolean;
  name: Localized;
  text: Localized;
  modifiers: AbilityModifierDraft[];
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
  gettingBetterRule: GettingBetterRule;
  gettingBetterNote: Localized;
};

const LANGUAGE_NAMES: Record<ClassLanguage, string> = { en: 'English', pl: 'Polish' };
const empty = (): Localized => ({ en: '', pl: '' });
const bookStat = (): StatDice => ({ count: 3, faces: 6, modifier: 0, dropLowest: false });

/** A new class: the book's defaults, no text yet. */
export function blankClassDraft(): ClassDraft {
  return {
    languages: ['en'],
    name: empty(),
    description: empty(),
    stats: { strength: bookStat(), agility: bookStat(), presence: bookStat(), toughness: bookStat() },
    hpDie: 8,
    omenDie: 2,
    weaponDie: 10,
    armorDie: 4,
    silver: { count: 2, faces: 6, multiplier: 10 },
    origins: [],
    abilities: [],
    randomAbilityCount: 0,
    gettingBetterRule: 'book',
    gettingBetterNote: empty(),
  };
}

/** What stops a draft from saving, as sentences a GM reads. Ranges and caps are the route schema's job. */
export function classDraftProblems(draft: ClassDraft): string[] {
  const problems: string[] = [];
  const text = (value: Localized, where: string) => {
    for (const language of draft.languages) {
      if (!value[language]?.trim()) problems.push(`${LANGUAGE_NAMES[language]} missing: ${where}`);
    }
  };
  text(draft.name, 'class name');
  text(draft.description, 'class description');
  draft.origins.forEach((origin, i) => text(origin, `origin ${i + 1}`));
  if (draft.origins.length === 0) problems.push('Add at least one origin');
  for (const stat of CLASS_STATS) {
    const dice = draft.stats[stat];
    if (dice.dropLowest && dice.count < 2) problems.push(`${stat} can drop its lowest die only when it rolls two or more`);
  }
  draft.abilities.forEach((ability, i) => {
    text(ability.name, `ability ${i + 1} name`);
    text(ability.text, `ability ${i + 1} rules text`);
    const seen = new Set<string>();
    for (const modifier of ability.modifiers) {
      const id = JSON.stringify([modifier.statistic, modifier.value, [...modifier.exclude].sort()]);
      if (seen.has(id)) {
        problems.push(`Ability “${ability.name[draft.languages[0]] || i + 1}” has the same modifier twice`);
        break;
      }
      seen.add(id);
    }
  });
  const pool = draft.abilities.filter((a) => a.random).length;
  if (draft.randomAbilityCount > pool) {
    problems.push(`Rolls ${draft.randomAbilityCount} random abilities, but the pool has ${pool}`);
  }
  if (draft.gettingBetterRule === 'specialist' && pool < draft.randomAbilityCount + 1) {
    problems.push('Specialist needs at least one more random ability than each scvm rolls');
  }
  return problems;
}

/** The generator's view of a draft. Origins and abilities are their text in `language`, standing in for keys. */
export function classSpecFromDraft(draft: ClassDraft, language: ClassLanguage): ClassSpec {
  const textIn = (value: Localized) => value[language] || value[draft.languages[0]];
  return {
    hpDie: draft.hpDie,
    omenDie: draft.omenDie,
    weaponDie: draft.weaponDie,
    armorDie: draft.armorDie,
    silverDice: Array.from({ length: draft.silver.count }, () => draft.silver.faces),
    silverModifier: draft.silver.multiplier,
    statDice: draft.stats,
    originKeys: draft.origins.map(textIn),
    abilities: draft.abilities.map((ability, i) => ({
      id: i,
      key: textIn(ability.name),
      isRandom: ability.random,
      position: i,
      grantItemKey: null,
      grantPetKey: null,
    })),
    randomAbilityCount: draft.randomAbilityCount,
  };
}
