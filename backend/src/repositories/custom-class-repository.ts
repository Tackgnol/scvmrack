import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { findTranslationsWithAuthoredFallback } from '../lib/class-translations.js';
import { stableKeys } from '../lib/stable-keys.js';
import {
  itemFromRow,
  itemRow,
  itemTypeOf,
  stableItemKeys,
  type ItemRowRead,
} from '../lib/class-items.js';
import type {
  AbilityModifierDraft,
  ClassDraft,
  ClassItemDraft,
  ClassLanguage,
  ClassStat,
  Localized,
} from '../lib/class-draft.js';

type Tx = Prisma.TransactionClient;

/** A saved Custom Class with every language's text, as the creator reloads it. */
export type CustomClassRows = {
  id: number;
  lineageId: string;
  ownerUserId: string | null;
  ownerName: string | null;
  visibility: 'private' | 'public';
  version: number;
  status: 'draft' | 'active' | 'archived';
  takenDownAt: Date | null;
  isLatest: boolean;
  playingCount: number;
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

export type StoredClassDraft = {
  id: number;
  classId: number | null;
  draft: ClassDraft;
  revision: number;
  updatedAt: Date;
};

const asStoredDraft = (row: {
  id: number;
  classId: number | null;
  payload: Prisma.JsonValue;
  revision: number;
  updatedAt: Date;
}): StoredClassDraft => ({
  id: row.id,
  classId: row.classId,
  draft: row.payload as unknown as ClassDraft,
  revision: row.revision,
  updatedAt: row.updatedAt,
});
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
    silverDice: Array.from(
      { length: draft.silver.count },
      () => draft.silver.faces
    ),
    silverModifier: draft.silver.multiplier,
    randomAbilityCount: draft.randomAbilityCount,
    gettingBetterRule: draft.gettingBetterRule,
  };
}

/** Writes one Class Item's catalog row; a retyped item gets a row under its new key. */
async function upsertItem(
  tx: Tx,
  key: string,
  item: ClassItemDraft,
  classId: number,
  source: string,
  position: number
): Promise<void> {
  const row = itemRow(item, classId, source, position);
  const args = {
    where: { key },
    create: { key, ...row.data },
    update: row.data,
  };
  switch (row.table) {
    case 'weapon':
      await tx.weapon.upsert(args as Prisma.WeaponUpsertArgs);
      break;
    case 'armor':
      await tx.armor.upsert(args as Prisma.ArmorUpsertArgs);
      break;
    case 'equipment':
      await tx.equipment.upsert(args as Prisma.EquipmentUpsertArgs);
      break;
    case 'pet':
      await tx.pet.upsert(args as Prisma.PetUpsertArgs);
      break;
  }
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
  const owned = { where: { classId: id }, select: { key: true } };
  const [texts, modifierRows, weapons, armors, equipment, pets] =
    await Promise.all([
      tx.translation.findMany({
        where: { key: { startsWith: `cc.${id}.` } },
        select: { key: true },
      }),
      tx.classAbilityModifier.findMany({
        where: { classId: id },
        select: { abilityKey: true },
      }),
    tx.weapon.findMany(owned),
    tx.armor.findMany(owned),
    tx.equipment.findMany(owned),
    tx.pet.findMany(owned),
  ]);
  const itemKeys = stableItemKeys(
    id,
    draft.items,
    [...weapons, ...armors, ...equipment, ...pets].map((row) => row.key)
  );
  const keyOfRef = new Map(
    draft.items.map((item, i) => [item.ref, itemKeys[i]])
  );
  const inUse = [
    ...texts.map((t) => t.key),
    ...modifierRows.map((m) => m.abilityKey),
  ];
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

  const hasNote = draft.languages.some((l) =>
    draft.gettingBetterNote[l].trim()
  );
  const entries: Array<[string, Localized]> = [
    [keys.name, draft.name],
    [keys.description, draft.description],
    ...(hasNote
      ? [[keys.note, draft.gettingBetterNote] as [string, Localized]]
      : []),
    ...draft.origins.map((origin, i): [string, Localized] => [
      originKeys[i],
      origin,
    ]),
    ...draft.abilities.flatMap(
      (ability, i): Array<[string, Localized]> => [
      [abilityKeys[i], ability.name],
      [`${abilityKeys[i]}.description`, ability.text],
      ...(ability.table
        ? ability.table.rows.map((row, roll): [string, Localized] => [
            `${abilityKeys[i]}.table.${roll + 1}`,
            row.text,
          ])
        : []),
      ]
    ),
    ...draft.items.flatMap(
      (item, i): Array<[string, Localized]> => [
      [itemKeys[i], item.name],
      [`${itemKeys[i]}.description`, item.description],
      ]
    ),
  ];
  await tx.translation.deleteMany({
    where: { key: { in: entries.map(([key]) => key).concat(keys.note) } },
  });
  await tx.translation.createMany({
    data: entries.flatMap(([key, text]) =>
      draft.languages
        .filter((locale) => text[locale].trim())
        .map((locale) => ({ locale, key, value: text[locale].trim() }))
    ),
  });

  await tx.origin.deleteMany({ where: { classId: id } });
  await tx.origin.createMany({
    data: originKeys.map((key, i) => ({ classId: id, roll: i + 1, key })),
  });

  for (const [i, item] of draft.items.entries()) {
    await upsertItem(
      tx,
      itemKeys[i],
      item,
      id,
      item.name[draft.languages[0]].trim(),
      i + 1
    );
  }

  await tx.ability.deleteMany({ where: { classId: id } });
  await tx.ability.createMany({
    data: draft.abilities.map((ability, i) => ({
      classId: id,
      tableDie: ability.table?.die ?? null,
      key: abilityKeys[i],
      isRandom: ability.random,
      position: i + 1,
      grantItemKey:
        ability.grantItem &&
        (keyOfRef.get(ability.grantItem) ?? ability.grantItem),
      grantPetKey:
        ability.grantPet &&
        (keyOfRef.get(ability.grantPet) ?? ability.grantPet),
    })),
  });
  await tx.classAbilityModifier.deleteMany({
    where: { classId: id, abilityKey: { in: abilityKeys } },
  });
  const savedAbilities = await tx.ability.findMany({
    where: { key: { in: abilityKeys } },
    select: { id: true, key: true },
  });
  const abilityIdByKey = new Map(
    savedAbilities.map((ability) => [ability.key, ability.id])
  );
  await tx.abilityTableRow.createMany({
    data: draft.abilities.flatMap(
      (ability, i) =>
      ability.table?.rows.map((row, roll) => ({
        abilityId: abilityIdByKey.get(abilityKeys[i])!,
        roll: roll + 1,
        textKey: `${abilityKeys[i]}.table.${roll + 1}`,
        itemKey: row.itemRef && (keyOfRef.get(row.itemRef) ?? row.itemRef),
      })) ?? []
    ),
  });

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

/** A class's granted Class Items, as the creator edits them, in the order they were made. */
async function loadItems(
  classId: number,
  keys: string[]
): Promise<ClassItemDraft[]> {
  if (keys.length === 0) return [];
  const where = { classId, key: { in: keys } };
  const [weapons, armors, equipment, pets, texts] = await Promise.all([
    prisma.weapon.findMany({ where }),
    prisma.armor.findMany({ where }),
    prisma.equipment.findMany({ where }),
    prisma.pet.findMany({ where }),
    prisma.translation.findMany({
      where: { key: { in: keys.flatMap((k) => [k, `${k}.description`]) } },
    }),
  ]);
  const text = (key: string): Localized => ({
    en: texts.find((t) => t.key === key && t.locale === 'en')?.value ?? '',
    pl: texts.find((t) => t.key === key && t.locale === 'pl')?.value ?? '',
  });
  const rows: ItemRowRead[] = [...weapons, ...armors, ...equipment, ...pets];
  return rows
    .sort(
      (a, b) =>
        (a.position ?? Infinity) - (b.position ?? Infinity) || a.id - b.id
    )
    .map((row) =>
      itemFromRow(
        itemTypeOf(row.key)!,
        row,
        text(row.key),
        text(`${row.key}.description`)
      )
    );
}
/** Removes a version that no character references, including its private catalog rows. */
async function deleteVersion(tx: Tx, id: number): Promise<void> {
  await Promise.all([
    tx.classAbilityModifier.deleteMany({ where: { classId: id } }),
    tx.origin.deleteMany({ where: { classId: id } }),
    tx.weapon.deleteMany({ where: { classId: id } }),
    tx.armor.deleteMany({ where: { classId: id } }),
    tx.equipment.deleteMany({ where: { classId: id } }),
    tx.pet.deleteMany({ where: { classId: id } }),
    tx.translation.deleteMany({ where: { key: { startsWith: `cc.${id}.` } } }),
  ]);
  // Ability table rows cascade from abilities.
  await tx.ability.deleteMany({ where: { classId: id } });
  await tx.class.delete({ where: { id } });
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

  /** The server copy of unfinished creator work, newest first; abandoned drafts expire after 90 days. */
  async listDrafts(ownerUserId: string): Promise<StoredClassDraft[]> {
    await prisma.classDraftRecord.deleteMany({
      where: {
        ownerUserId,
        updatedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    });
    const rows = await prisma.classDraftRecord.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(asStoredDraft);
  },

  async getDraft(
    ownerUserId: string,
    id: number
  ): Promise<StoredClassDraft | null> {
    const row = await prisma.classDraftRecord.findFirst({
      where: { id, ownerUserId },
    });
    return row ? asStoredDraft(row) : null;
  },

  async countNewDrafts(ownerUserId: string): Promise<number> {
    return prisma.classDraftRecord.count({
      where: { ownerUserId, classId: null },
    });
  },

  /** Creates a draft or advances its revision only when the caller still holds the current revision. */
  async saveDraft(input: {
    id?: number;
    ownerUserId: string;
    classId: number | null;
    draft: ClassDraft;
    revision?: number;
    force?: boolean;
  }): Promise<StoredClassDraft | null> {
    if (input.id === undefined) {
      const row = await prisma.classDraftRecord.create({
        data: {
          ownerUserId: input.ownerUserId,
          classId: input.classId,
          payload: input.draft,
        },
      });
      return asStoredDraft(row);
    }
    const where = input.force
      ? { id: input.id, ownerUserId: input.ownerUserId }
      : {
          id: input.id,
          ownerUserId: input.ownerUserId,
          revision: input.revision,
        };
    const updated = await prisma.classDraftRecord.updateMany({
      where,
      data: { payload: input.draft, revision: { increment: 1 } },
    });
    if (updated.count === 0) return null;
    const row = await prisma.classDraftRecord.findUniqueOrThrow({
      where: { id: input.id },
    });
    return asStoredDraft(row);
  },

  async deleteDraft(ownerUserId: string, id: number): Promise<boolean> {
    const deleted = await prisma.classDraftRecord.deleteMany({
      where: { id, ownerUserId },
    });
    return deleted.count > 0;
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

  async update(id: number, draft: ClassDraft): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.class.update({ where: { id }, data: classColumns(draft) });
      await writeText(tx, id, draft);
    });
  },

  /** Changes the visibility of every available version in a Custom Class lineage. */
  async setVisibility(
    id: number,
    visibility: 'private' | 'public'
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const current = await tx.class.findUniqueOrThrow({
        where: { id },
        select: { lineageId: true, ownerUserId: true },
      });
      await tx.class.updateMany({
        where: { lineageId: current.lineageId, takenDownAt: null },
        data: { visibility },
      });
      if (visibility === 'private' && current.ownerUserId) {
        await tx.partyClassPool.deleteMany({
          where: {
            lineageId: current.lineageId,
            party: { ownerUserId: { not: current.ownerUserId } },
          },
        });
      }
    });
  },
  /** Forks the current version, then discards superseded versions that no scvm has used. */
  async createVersion(id: number, draft: ClassDraft): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.class.findUniqueOrThrow({ where: { id } });
      const next = await tx.class.create({
        data: {
          ...classColumns(draft),
          source: current.source,
          ownerUserId: current.ownerUserId,
          visibility: current.visibility,
          status: 'active',
          lineageId: current.lineageId,
          version: current.version + 1,
        },
        select: { id: true },
      });
      await writeText(tx, next.id, draft);
      const older = await tx.class.findMany({
        where: { lineageId: current.lineageId, id: { not: next.id } },
        select: { id: true },
      });
      const played = await tx.character.groupBy({
        by: ['classId'],
        where: { classId: { in: older.map((row) => row.id) } },
      });
      const playedIds = new Set(played.map((row) => row.classId));
      for (const row of older)
        if (!playedIds.has(row.id)) await deleteVersion(tx, row.id);
      return next.id;
    });
  },

  /** Deletes an unused lineage, or archives it when a scvm still needs one of its versions. */
  async remove(id: number): Promise<{ archived: boolean }> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.class.findUniqueOrThrow({
        where: { id },
        select: { lineageId: true },
      });
      const versions = await tx.class.findMany({
        where: { lineageId: current.lineageId },
        select: { id: true },
      });
      const played = await tx.character.count({
        where: { classId: { in: versions.map((row) => row.id) } },
      });
      if (played > 0) {
        await Promise.all([
          tx.class.updateMany({
            where: { lineageId: current.lineageId },
            data: { status: 'archived' },
          }),
          tx.partyClassPool.deleteMany({
            where: { lineageId: current.lineageId },
          }),
        ]);
        return { archived: true };
      }
      await tx.partyClassPool.deleteMany({
        where: { lineageId: current.lineageId },
      });
      for (const version of versions) await deleteVersion(tx, version.id);
      return { archived: false };
    });
  },

  /** Restores an owner-archived lineage unless it has since been taken down. */
  async restore(id: number): Promise<boolean> {
    const restored = await prisma.class.updateMany({
      where: { id, takenDownAt: null },
      data: { status: 'active' },
    });
    if (restored.count === 0) return false;
    const current = await prisma.class.findUniqueOrThrow({
      where: { id },
      select: { lineageId: true },
    });
    await prisma.class.updateMany({
      where: { lineageId: current.lineageId, takenDownAt: null },
      data: { status: 'active' },
    });
    return true;
  },
  async findWithText(id: number): Promise<CustomClassRows | null> {
    const cls = await prisma.class.findFirst({ where: { id, source: 'user' }, include: { owner: { select: { name: true } } } });
    if (!cls) return null;
    const [latest, playingCount, origins, abilities, modifiers, translations] =
      await Promise.all([
        prisma.class.aggregate({
          where: { lineageId: cls.lineageId },
          _max: { version: true },
        }),
        prisma.character.count({ where: { classId: id } }),
        prisma.origin.findMany({
          where: { classId: id },
          orderBy: { roll: 'asc' },
          select: { key: true },
        }),
      prisma.ability.findMany({
        where: { classId: id },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: {
            key: true,
            isRandom: true,
            grantItemKey: true,
            grantPetKey: true,
            tableDie: true,
            tableRows: {
              orderBy: { roll: 'asc' },
              select: { roll: true, textKey: true, itemKey: true },
            },
          },
        }),
        prisma.classAbilityModifier.findMany({
          where: { classId: id },
          orderBy: { id: 'asc' },
        }),
        prisma.translation.findMany({
          where: { key: { startsWith: `cc.${id}.` } },
      }),
    ]);
    const grantKeys = abilities
      .flatMap((a) => [
        a.grantItemKey,
        a.grantPetKey,
        ...a.tableRows.map((row) => row.itemKey),
      ])
      .filter((key): key is string => !!key && itemTypeOf(key) !== null);
    const items = await loadItems(id, grantKeys);
    const modifiersOf = (key: string): AbilityModifierDraft[] =>
      modifiers
        .filter((m) => m.abilityKey === key)
        .map((m) => ({
          statistic: m.statistic as ClassStat,
          value: m.value,
          exclude: Array.isArray(m.exclude) ? (m.exclude as string[]) : [],
        }));
    const text = (key: string | null): Localized => ({
      en:
        translations.find((t) => t.key === key && t.locale === 'en')?.value ??
        '',
      pl:
        translations.find((t) => t.key === key && t.locale === 'pl')?.value ??
        '',
    });
    const silverDice = cls.silverDice.length > 0 ? cls.silverDice : [6];
    return {
      id: cls.id,
      lineageId: cls.lineageId,
      ownerUserId: cls.ownerUserId,
      ownerName: cls.owner?.name ?? null,
      visibility: cls.visibility,
      version: cls.version,
      status: cls.status,
      takenDownAt: cls.takenDownAt,
      isLatest: latest._max.version === cls.version,
      playingCount,
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
          grantItem: a.grantItemKey,
          grantPet: a.grantPetKey,
          table: a.tableDie
            ? {
            die: a.tableDie as 2 | 3 | 4 | 6 | 8 | 10 | 12,
                rows: a.tableRows.map((row) => ({
                  text: text(row.textKey),
                  itemRef: row.itemKey,
                })),
              }
            : null,
        })),
        items,
        randomAbilityCount: cls.randomAbilityCount ?? 0,
        gettingBetterRule: cls.gettingBetterRule,
        gettingBetterNote: text(cls.gettingBetterNoteKey),
      },
    };
  },


  /** Loads the latest version in a Custom Class lineage for read-only rendering. */
  async findLatestWithText(id: number): Promise<CustomClassRows | null> {
    const current = await prisma.class.findFirst({
      where: { id, source: 'user' },
      select: { lineageId: true },
    });
    if (!current) return null;
    const latest = await prisma.class.findFirst({
      where: { lineageId: current.lineageId, source: 'user' },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    return latest ? this.findWithText(latest.id) : null;
  },

  /** Whether a character owner belongs to a party where this lineage is enabled. */
  async isVisibleToPartyMember(input: { lineageId: string; userId: string | null; sessionId: string | null }): Promise<boolean> {
    if (!input.userId && !input.sessionId) return false;
    return Boolean(await prisma.partyClassPool.findFirst({
      where: {
        lineageId: input.lineageId,
        party: { members: { some: { OR: [
          ...(input.userId ? [{ userId: input.userId }] : []),
          ...(input.sessionId ? [{ sessionId: input.sessionId }] : []),
        ] } } },
      },
      select: { partyId: true },
    }));
  },
  /** The account's Custom Classes at their latest version, newest first. */
  async listOwned(
    ownerUserId: string,
    locale: string
  ): Promise<OwnClassSummary[]> {
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
    const countByClass = new Map(
      originCounts.map((r) => [r.classId, r._count._all])
    );
    const summaries = await Promise.all(
      rows.map(async (row) => {
        const keys = [row.nameKey, row.descriptionKey].filter(
          (k): k is string => k !== null
        );
        const text = await findTranslationsWithAuthoredFallback(
          locale,
          row.languages,
          keys
        );
        return {
          id: row.id,
          lineageId: row.lineageId,
          name: (row.nameKey ? text.get(row.nameKey) : undefined) ?? row.name,
          description:
            (row.descriptionKey ? text.get(row.descriptionKey) : undefined) ??
            null,
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
