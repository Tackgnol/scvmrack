import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { findTranslationsWithAuthoredFallback } from '../lib/class-translations.js';
import { stableKeys } from '../lib/stable-keys.js';
import type { AbilityModifierDraft, ClassDraft, ClassLanguage, ClassStat, Localized } from '../lib/class-draft.js';

type Tx = Prisma.TransactionClient;

/** A saved Custom Class with every language's text, as the creator reloads it. */
export type CustomClassRows = {
  id: number;
  lineageId: string;
  ownerUserId: string | null;
  isLatest: boolean;
  draft: ClassDraft;
};

export type OwnClassSummary = {
  id: number;
  lineageId: string;
  name: string;
  description: string | null;
  languages: string[];
  visibility: 'private' | 'public';
  status: 'draft' | 'active' | 'archived';
  originCount: number;
};

const keysFor = (id: number) => ({
  name: `cc.${id}.name`,
  description: `cc.${id}.description`,
  note: `cc.${id}.getting_better_note`,
  origin: (n: number) => `cc.${id}.origin.${n}`,
  ability: (n: number) => `cc.${id}.ability.${n}`,
});


function classColumns(draft: ClassDraft) {
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
 * Writes a class's text, origins and abilities under its `cc.<id>.*` keys.
 * Origins and abilities keep the key they were saved with, so characters that
 * rolled one keep its text and modifiers; a removed one's text and modifiers
 * stay for them, only its row (what new scvm roll) goes.
 */
async function writeText(tx: Tx, id: number, draft: ClassDraft): Promise<void> {
  const keys = keysFor(id);
  // Every key this class ever gave out: removed entries leave their text and modifiers behind.
  const [texts, modifierRows] = await Promise.all([
    tx.translation.findMany({ where: { key: { startsWith: `cc.${id}.` } }, select: { key: true } }),
    tx.classAbilityModifier.findMany({ where: { classId: id }, select: { abilityKey: true } }),
  ]);
  const inUse = [...texts.map((t) => t.key), ...modifierRows.map((m) => m.abilityKey)];
  const originKeys = stableKeys(
    `cc.${id}.origin.`,
    inUse,
    draft.origins.map((o) => o.key),
    keys.origin
  );
  const abilityKeys = stableKeys(
    `cc.${id}.ability.`,
    inUse,
    draft.abilities.map((a) => a.key),
    keys.ability
  );

  const hasNote = draft.languages.some((l) => draft.gettingBetterNote[l].trim());
  const entries: Array<[string, Localized]> = [
    [keys.name, draft.name],
    [keys.description, draft.description],
    ...(hasNote ? [[keys.note, draft.gettingBetterNote] as [string, Localized]] : []),
    ...draft.origins.map((origin, i): [string, Localized] => [originKeys[i], origin]),
    ...draft.abilities.flatMap((ability, i): Array<[string, Localized]> => [
      [abilityKeys[i], ability.name],
      [`${abilityKeys[i]}.description`, ability.text],
    ]),
  ];
  await tx.translation.deleteMany({ where: { key: { in: entries.map(([key]) => key).concat(keys.note) } } });
  await tx.translation.createMany({
    data: entries.flatMap(([key, text]) =>
      draft.languages
        .filter((locale) => text[locale].trim())
        .map((locale) => ({ locale, key, value: text[locale].trim() }))
    ),
  });

  await tx.origin.deleteMany({ where: { classId: id } });
  await tx.origin.createMany({ data: originKeys.map((key, i) => ({ classId: id, roll: i + 1, key })) });

  await tx.ability.deleteMany({ where: { classId: id } });
  await tx.ability.createMany({
    data: draft.abilities.map((ability, i) => ({
      classId: id,
      key: abilityKeys[i],
      isRandom: ability.random,
      position: i,
    })),
  });
  await tx.classAbilityModifier.deleteMany({ where: { classId: id, abilityKey: { in: abilityKeys } } });
  await tx.classAbilityModifier.createMany({
    data: draft.abilities.flatMap((ability, i) =>
      ability.modifiers.map((modifier) => ({
        classId: id,
        abilityKey: abilityKeys[i],
        statistic: modifier.statistic,
        value: modifier.value,
        exclude: modifier.exclude,
        source: ability.name[draft.languages[0]].trim(),
      }))
    ),
  });

  await tx.class.update({
    where: { id },
    data: {
      nameKey: keys.name,
      descriptionKey: keys.description,
      gettingBetterNoteKey: hasNote ? keys.note : null,
    },
  });
}

/** Custom Class data access: the GM's own classes and the creator's saves. */
export const customClassRepository = {
  /** Custom Classes (lineages) the account holds, archived included. */
  async countOwnedLineages(ownerUserId: string): Promise<number> {
    const rows = await prisma.class.findMany({
      where: { source: 'user', ownerUserId },
      distinct: ['lineageId'],
      select: { lineageId: true },
    });
    return rows.length;
  },

  async create(ownerUserId: string, draft: ClassDraft): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const { id } = await tx.class.create({
        data: {
          ...classColumns(draft),
          source: 'user',
          ownerUserId,
          visibility: 'private',
          status: 'active',
        },
        select: { id: true },
      });
      await writeText(tx, id, draft);
      return id;
    });
  },

  // ponytail: edits in place even when characters play the class; Class Versions (RPG-275) forks a new version instead.
  async update(id: number, draft: ClassDraft): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.class.update({ where: { id }, data: classColumns(draft) });
      await writeText(tx, id, draft);
    });
  },

  async findWithText(id: number): Promise<CustomClassRows | null> {
    const cls = await prisma.class.findFirst({ where: { id, source: 'user' } });
    if (!cls) return null;
    const [latest, origins, abilities, modifiers, translations] = await Promise.all([
      prisma.class.aggregate({ where: { lineageId: cls.lineageId }, _max: { version: true } }),
      prisma.origin.findMany({ where: { classId: id }, orderBy: { roll: 'asc' }, select: { key: true } }),
      prisma.ability.findMany({
        where: { classId: id },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: { key: true, isRandom: true },
      }),
      prisma.classAbilityModifier.findMany({ where: { classId: id }, orderBy: { id: 'asc' } }),
      prisma.translation.findMany({ where: { key: { startsWith: `cc.${id}.` } } }),
    ]);
    const modifiersOf = (key: string): AbilityModifierDraft[] =>
      modifiers
        .filter((m) => m.abilityKey === key)
        .map((m) => ({
          statistic: m.statistic as ClassStat,
          value: m.value,
          exclude: Array.isArray(m.exclude) ? (m.exclude as string[]) : [],
        }));
    const text = (key: string | null): Localized => ({
      en: translations.find((t) => t.key === key && t.locale === 'en')?.value ?? '',
      pl: translations.find((t) => t.key === key && t.locale === 'pl')?.value ?? '',
    });
    const silverDice = cls.silverDice.length > 0 ? cls.silverDice : [6];
    return {
      id: cls.id,
      lineageId: cls.lineageId,
      ownerUserId: cls.ownerUserId,
      isLatest: latest._max.version === cls.version,
      draft: {
        languages: cls.languages as ClassLanguage[],
        name: text(cls.nameKey),
        description: text(cls.descriptionKey),
        stats: cls.statDice as ClassDraft['stats'],
        hpDie: cls.hpDie ?? 8,
        omenDie: cls.omenDie,
        weaponDie: cls.weaponDie ?? 10,
        armorDie: cls.armorDie ?? 4,
        silver: {
          count: cls.silverDice.length || 1,
          faces: silverDice[0],
          multiplier: cls.silverModifier ?? 10,
        },
        origins: origins.map((o) => ({ ...text(o.key), key: o.key })),
        abilities: abilities.map((a) => ({
          key: a.key,
          random: a.isRandom === true,
          name: text(a.key),
          text: text(`${a.key}.description`),
          modifiers: modifiersOf(a.key),
        })),
        randomAbilityCount: cls.randomAbilityCount ?? 0,
        gettingBetterRule: cls.gettingBetterRule,
        gettingBetterNote: text(cls.gettingBetterNoteKey),
      },
    };
  },

  /** The account's Custom Classes at their latest version, newest first. */
  async listOwned(ownerUserId: string, locale: string): Promise<OwnClassSummary[]> {
    const rows = await prisma.class.findMany({
      where: { source: 'user', ownerUserId },
      orderBy: [{ lineageId: 'asc' }, { version: 'desc' }],
      distinct: ['lineageId'],
      select: {
        id: true,
        lineageId: true,
        name: true,
        nameKey: true,
        descriptionKey: true,
        languages: true,
        visibility: true,
        status: true,
      },
    });
    const originCounts = await prisma.origin.groupBy({
      by: ['classId'],
      where: { classId: { in: rows.map((r) => r.id) } },
      _count: { _all: true },
    });
    const countByClass = new Map(originCounts.map((r) => [r.classId, r._count._all]));
    const summaries = await Promise.all(
      rows.map(async (row) => {
        const keys = [row.nameKey, row.descriptionKey].filter((k): k is string => k !== null);
        const text = await findTranslationsWithAuthoredFallback(locale, row.languages, keys);
        return {
          id: row.id,
          lineageId: row.lineageId,
          name: (row.nameKey ? text.get(row.nameKey) : undefined) ?? row.name,
          description: (row.descriptionKey ? text.get(row.descriptionKey) : undefined) ?? null,
          languages: row.languages,
          visibility: row.visibility,
          status: row.status,
          originCount: countByClass.get(row.id) ?? 0,
        };
      })
    );
    return summaries.sort((a, b) => b.id - a.id);
  },
};
