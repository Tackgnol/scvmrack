/**
 * The rules for a Class Version's stored shape, kept free of I/O: which keys a save writes and
 * replaces, how stored rows rebuild a draft, and what a moderation removal blanks. The class
 * version repository reads and writes the rows these functions plan and map.
 */

import type { Ability, AbilityTableRow, Class, ClassAbilityModifier, Prisma, Translation } from '@prisma/client';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../config/locales.js';
import type { AbilityStat } from './ability-modifiers.js';
import {
  type AbilityModifierDraft,
  type ClassDraft,
  type Localized,
  type TableDie,
} from './class-draft.js';
import { itemFromRow, itemTypeOf, stableItemKeys, type ItemRowRead } from './class-items.js';
import { customClassKeyRoot } from './class-model.js';
import { CLASSLESS_DEFAULTS } from './generate-character.js';
import { stableKeys } from './stable-keys.js';

type TextRow = Pick<Translation, 'key' | 'locale' | 'value'>;
type ItemTable = 'weapon' | 'armor';
type CatalogModifier = { source?: string } & Record<string, unknown>;

/** The user-written content of a lineage's versions, as a moderation removal blanks it. */
export type VersionContent = {
  versions: Array<{
    id: number;
    name: string;
    appendix: string | null;
    translations: TextRow[];
    modifiers: Array<{ id: number; source: string }>;
    /** Optional so evidence logged before Class Items were covered still restores. */
    items?: Array<{ table: ItemTable; key: string; modifiers: Prisma.JsonValue }>;
  }>;
};

/** The class-row columns a version's draft is rebuilt from. */
export type VersionRow = Pick<
  Class,
  | 'id'
  | 'languages'
  | 'nameKey'
  | 'descriptionKey'
  | 'statDice'
  | 'hpDie'
  | 'omenDie'
  | 'weaponDie'
  | 'armorDie'
  | 'silverDice'
  | 'silverModifier'
  | 'randomAbilityCount'
  | 'gettingBetterRule'
  | 'gettingBetterNoteKey'
>;

/** The stored rows a version's draft is rebuilt from, besides its class row. */
export type VersionRows = {
  origins: Array<{ key: string }>;
  abilities: Array<
    Pick<Ability, 'key' | 'isRandom' | 'grantItemKey' | 'grantPetKey' | 'tableDie'> & {
      tableRows: Array<Pick<AbilityTableRow, 'roll' | 'textKey' | 'itemKey'>>;
    }
  >;
  modifiers: Array<Pick<ClassAbilityModifier, 'abilityKey' | 'statistic' | 'value' | 'exclude'>>;
  translations: TextRow[];
  items: ItemRowRead[];
  itemTexts: TextRow[];
};

/** The text stored under `key` in every class language; a missing translation is empty. */
function localizedFrom(rows: TextRow[], key: string | null): Localized {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((language) => [
      language,
      rows.find((row) => row.key === key && row.locale === language)?.value ?? '',
    ])
  ) as Localized;
}

const keysFor = (id: number) => ({
  name: `${customClassKeyRoot(id)}.name`,
  description: `${customClassKeyRoot(id)}.description`,
  note: `${customClassKeyRoot(id)}.getting_better_note`,
  origin: (n: number) => `${customClassKeyRoot(id)}.origin.${n}`,
  ability: (n: number) => `${customClassKeyRoot(id)}.ability.${n}`,
});

/** The class-row columns a draft sets on a version. */
export function versionColumns(draft: ClassDraft) {
  return {
    name: draft.name[draft.languages[0]].trim(),
    languages: draft.languages,
    statDice: draft.stats,
    hpDie: draft.hpDie,
    omenDie: draft.omenDie,
    weaponDie: draft.weaponDie,
    armorDie: draft.armorDie,
    silverDice: Array.from({ length: draft.silver.count }, () => draft.silver.faces),
    silverModifier: draft.silver.multiplier,
    randomAbilityCount: draft.randomAbilityCount,
    gettingBetterRule: draft.gettingBetterRule,
  };
}

/**
 * Plans the rows a save of `draft` writes over version `id`, given the keys the version already
 * gave out. Origins, abilities and items keep the key they were saved with, so characters that
 * rolled one keep its text and modifiers; only the keys in `replaced` are rewritten, so a removed
 * entry's text and modifiers stay for those characters and only its row (what new scvm roll) goes.
 */
export function planVersionWrite(
  id: number,
  draft: ClassDraft,
  existing: { textKeys: string[]; modifierAbilityKeys: string[]; itemKeys: string[] }
) {
  const keys = keysFor(id);
  const firstLanguage = draft.languages[0];
  const itemKeys = stableItemKeys(id, draft.items, existing.itemKeys);
  const keyOfRef = new Map(draft.items.map((item, i) => [item.ref, itemKeys[i]]));
  const savedKeyOf = (ref: string | null) => ref && (keyOfRef.get(ref) ?? ref);
  const inUse = [...existing.textKeys, ...existing.modifierAbilityKeys];
  const originKeys = stableKeys(`${customClassKeyRoot(id)}.origin.`, inUse, draft.origins.map((o) => o.key), keys.origin);
  const abilityKeys = stableKeys(`${customClassKeyRoot(id)}.ability.`, inUse, draft.abilities.map((a) => a.key), keys.ability);
  const hasNote = draft.languages.some((l) => draft.gettingBetterNote[l].trim());
  const entries: Array<[string, Localized]> = [
    [keys.name, draft.name],
    [keys.description, draft.description],
    ...(hasNote ? [[keys.note, draft.gettingBetterNote] as [string, Localized]] : []),
    ...draft.origins.map((origin, i): [string, Localized] => [originKeys[i], origin]),
    ...draft.abilities.flatMap((ability, i): Array<[string, Localized]> => [
      [abilityKeys[i], ability.name],
      [`${abilityKeys[i]}.description`, ability.text],
      ...(ability.table
        ? ability.table.rows.map((row, roll): [string, Localized] => [`${abilityKeys[i]}.table.${roll + 1}`, row.text])
        : []),
    ]),
    ...draft.items.flatMap((item, i): Array<[string, Localized]> => [
      [itemKeys[i], item.name],
      [`${itemKeys[i]}.description`, item.description],
    ]),
  ];
  return {
    replaced: {
      textKeys: entries.map(([key]) => key).concat(keys.note),
      modifierAbilityKeys: abilityKeys,
    },
    translations: entries.flatMap(([key, text]) =>
      draft.languages
        .filter((locale) => text[locale].trim())
        .map((locale) => ({ locale, key, value: text[locale].trim() }))
    ),
    originKeys,
    items: draft.items.map((item, i) => ({
      key: itemKeys[i],
      item,
      source: item.name[firstLanguage].trim(),
      position: i + 1,
    })),
    abilities: draft.abilities.map((ability, i) => ({
      key: abilityKeys[i],
      isRandom: ability.random,
      position: i + 1,
      tableDie: ability.table?.die ?? null,
      grantItemKey: savedKeyOf(ability.grantItem),
      grantPetKey: savedKeyOf(ability.grantPet),
      tableRows:
        ability.table?.rows.map((row, roll) => ({
          roll: roll + 1,
          textKey: `${abilityKeys[i]}.table.${roll + 1}`,
          itemKey: savedKeyOf(row.itemRef),
        })) ?? [],
      modifiers: ability.modifiers.map((modifier) => ({
        statistic: modifier.statistic,
        value: modifier.value,
        exclude: modifier.exclude,
        source: ability.name[firstLanguage].trim(),
      })),
    })),
    columns: {
      nameKey: keys.name,
      descriptionKey: keys.description,
      gettingBetterNoteKey: hasNote ? keys.note : null,
    },
  };
}

export type VersionPlan = ReturnType<typeof planVersionWrite>;

/** The Class Item keys a version's abilities grant, which are the items its draft holds. */
export function grantedItemKeys(abilities: VersionRows['abilities']): string[] {
  return abilities
    .flatMap((a) => [a.grantItemKey, a.grantPetKey, ...a.tableRows.map((row) => row.itemKey)])
    .filter((key): key is string => !!key && itemTypeOf(key) !== null);
}

/** Rebuilds the draft a version was saved from, with every language's text, as the creator reloads it. */
export function draftFromVersion(cls: VersionRow, rows: VersionRows): ClassDraft {
  const modifiersOf = (key: string): AbilityModifierDraft[] =>
    rows.modifiers
      .filter((m) => m.abilityKey === key)
      .map((m) => ({
        statistic: m.statistic as AbilityStat,
        value: m.value,
        exclude: (Array.isArray(m.exclude) ? m.exclude : []) as AbilityModifierDraft['exclude'],
      }));
  const text = (key: string | null) => localizedFrom(rows.translations, key);
  const itemText = (key: string) => localizedFrom(rows.itemTexts, key);
  const silverDice = cls.silverDice.length > 0 ? cls.silverDice : CLASSLESS_DEFAULTS.silverDice;
  // The columns are plain integers; the creator only ever saved values the draft schema allowed.
  return {
    languages: cls.languages as SupportedLocale[],
    name: text(cls.nameKey),
    description: text(cls.descriptionKey),
    stats: cls.statDice as ClassDraft['stats'],
    hpDie: (cls.hpDie ?? CLASSLESS_DEFAULTS.hpDie) as ClassDraft['hpDie'],
    omenDie: cls.omenDie as ClassDraft['omenDie'],
    weaponDie: (cls.weaponDie ?? CLASSLESS_DEFAULTS.weaponDie) as ClassDraft['weaponDie'],
    armorDie: (cls.armorDie ?? CLASSLESS_DEFAULTS.armorDie) as ClassDraft['armorDie'],
    silver: {
      count: silverDice.length,
      faces: silverDice[0] as ClassDraft['silver']['faces'],
      multiplier: cls.silverModifier ?? CLASSLESS_DEFAULTS.silverModifier,
    },
    origins: rows.origins.map((o) => ({ ...text(o.key), key: o.key })),
    abilities: rows.abilities.map((a) => ({
      key: a.key,
      random: a.isRandom === true,
      name: text(a.key),
      text: text(`${a.key}.description`),
      modifiers: modifiersOf(a.key),
      grantItem: a.grantItemKey,
      grantPet: a.grantPetKey,
      table: a.tableDie
        ? {
            die: a.tableDie as TableDie,
            rows: a.tableRows.map((row) => ({ text: text(row.textKey), itemRef: row.itemKey })),
          }
        : null,
    })),
    items: [...rows.items]
      .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity) || a.id - b.id)
      .map((row) => itemFromRow(itemTypeOf(row.key)!, row, itemText(row.key), itemText(`${row.key}.description`))),
    randomAbilityCount: cls.randomAbilityCount ?? 0,
    gettingBetterRule: cls.gettingBetterRule,
    gettingBetterNote: text(cls.gettingBetterNoteKey),
  };
}

/**
 * The content a moderation removal leaves: every piece of user-written text becomes `marker`.
 * The class name column stays (moderators see it in the queue and log), and so does each Class
 * Item's ammo type: inventories match ammo on it, and `Infinite` marks endless ammo.
 */
export function blankedContent(content: VersionContent, marker: string): VersionContent {
  return {
    versions: content.versions.map((version) => ({
      ...version,
      appendix: marker,
      translations: version.translations.map((translation) => ({ ...translation, value: marker })),
      modifiers: version.modifiers.map((modifier) => ({ ...modifier, source: marker })),
      items: version.items?.map((item) => ({
        ...item,
        modifiers: Array.isArray(item.modifiers)
          ? (item.modifiers as CatalogModifier[]).map((modifier) => ({ ...modifier, source: marker }))
          : item.modifiers,
      })),
    })),
  };
}
