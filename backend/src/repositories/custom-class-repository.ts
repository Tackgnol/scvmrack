import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { translatedClassTexts } from '../lib/class-translations.js';
import { stableKeys } from '../lib/stable-keys.js';
import {
  itemFromRow,
  itemRow,
  itemTypeOf,
  stableItemKeys,
  type ItemRowRead,
} from '../lib/class-items.js';
import {
  CLASS_LANGUAGES,
  type AbilityModifierDraft,
  type ClassDraft,
  type ClassItemDraft,
  type ClassLanguage,
  type ClassStat,
  type Localized,
  type TableDie,
} from '../lib/class-draft.js';
import { CLASSLESS_DEFAULTS } from '../lib/generate-character.js';
import { customClassKeyRoot, type ClassStatus, type ClassVisibility } from '../lib/class-model.js';

type Tx = Prisma.TransactionClient;

/** A saved Custom Class with every language's text, as the creator reloads it. */
export type CustomClassRows = {
  id: number;
  lineageId: string;
  ownerUserId: string | null;
  ownerName: string | null;
  visibility: ClassVisibility;
  version: number;
  status: ClassStatus;
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
  visibility: ClassVisibility;
  status: ClassStatus;
  originCount: number;
  takenDownAt: string | null;
  takedownReason: string | null;
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
/** The text stored under `key` in every class language; a missing translation is empty. */
function localizedFrom(
  rows: Array<{ key: string; locale: string; value: string }>,
  key: string | null
): Localized {
  return Object.fromEntries(
    CLASS_LANGUAGES.map((language) => [
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
        where: { key: { startsWith: `${customClassKeyRoot(id)}.` } },
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
    `${customClassKeyRoot(id)}.origin.`,
    inUse,
    draft.origins.map((o) => o.key),
    keys.origin
  );
  const abilityKeys = stableKeys(
    `${customClassKeyRoot(id)}.ability.`,
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
  if (keys.length === 0) {
    return [];
  }
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
  const text = (key: string) => localizedFrom(texts, key);
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
    tx.translation.deleteMany({ where: { key: { startsWith: `${customClassKeyRoot(id)}.` } } }),
  ]);
  // Ability table rows cascade from abilities.
  await tx.ability.deleteMany({ where: { classId: id } });
  await tx.class.delete({ where: { id } });
}
/** Lineage reads and writes bound to one transaction, so a service can combine them atomically. */
function lineageOps(tx: Tx) {
  return {
    /** Serializes this owner's publishes until the transaction ends. */
    async lockOwner(ownerUserId: string): Promise<void> {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerUserId}))`;
    },

    async findPublishState(id: number) {
      return tx.class.findUniqueOrThrow({
        where: { id },
        select: { lineageId: true, visibility: true, firstPublishedAt: true },
      });
    },

    /** How many of the owner's lineages were first published at or after `since`. */
    async countFirstPublishedSince(ownerUserId: string, since: Date): Promise<number> {
      const rows = await tx.class.groupBy({
        by: ['lineageId'],
        where: { ownerUserId, firstPublishedAt: { gte: since } },
      });
      return rows.length;
    },

    /** Sets the visibility of every version that is not taken down. */
    async setVisibility(
      lineageId: string,
      visibility: ClassVisibility,
      firstPublishedAt?: Date
    ): Promise<void> {
      await tx.class.updateMany({
        where: { lineageId, takenDownAt: null },
        data: { visibility, firstPublishedAt },
      });
    },

    /** Sets the status of every version that is not taken down; returns how many changed. */
    async setStatus(lineageId: string, status: ClassStatus): Promise<number> {
      const updated = await tx.class.updateMany({
        where: { lineageId, takenDownAt: null },
        data: { status },
      });
      return updated.count;
    },

    /** Drops the lineage from party pools, except the pools of `keepOwnerUserId`'s parties. */
    async removeFromPools(lineageId: string, keepOwnerUserId?: string): Promise<void> {
      await tx.partyClassPool.deleteMany({
        where: {
          lineageId,
          ...(keepOwnerUserId ? { party: { ownerUserId: { not: keepOwnerUserId } } } : {}),
        },
      });
    },

    async versionIds(lineageId: string): Promise<number[]> {
      const rows = await tx.class.findMany({ where: { lineageId }, select: { id: true } });
      return rows.map((row) => row.id);
    },

    /** The versions among `ids` that at least one scvm plays. */
    async playedVersionIds(ids: number[]): Promise<Set<number>> {
      const rows = await tx.character.groupBy({
        by: ['classId'],
        where: { classId: { in: ids } },
      });
      return new Set(rows.flatMap((row) => (row.classId === null ? [] : [row.classId])));
    },

    async deleteVersions(ids: number[]): Promise<void> {
      for (const id of ids) {
        await deleteVersion(tx, id);
      }
    },

    /** Saves `draft` as the next version of `fromId`, keeping its lineage, owner and publication. */
    async insertNextVersion(fromId: number, draft: ClassDraft): Promise<number> {
      const current = await tx.class.findUniqueOrThrow({ where: { id: fromId } });
      const { id } = await tx.class.create({
        data: {
          ...classColumns(draft),
          source: current.source,
          ownerUserId: current.ownerUserId,
          visibility: current.visibility,
          firstPublishedAt: current.firstPublishedAt,
          status: 'active',
          lineageId: current.lineageId,
          version: current.version + 1,
        },
        select: { id: true },
      });
      await writeText(tx, id, draft);
      return id;
    },
  };
}

export type LineageOps = ReturnType<typeof lineageOps>;

/** Custom Class data access: the GM's own classes and the creator's saves. */
export const customClassRepository = {
  /** Runs `work` in one transaction with the lineage operations bound to it. */
  transaction<T>(work: (ops: LineageOps) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => work(lineageOps(tx)));
  },

  /** Custom Classes (lineages) the account holds, archived included. */
  async countOwnedLineages(ownerUserId: string): Promise<number> {
    const rows = await prisma.class.findMany({
      where: { source: 'user', ownerUserId },
      distinct: ['lineageId'],
      select: { lineageId: true },
    });
    return rows.length;
  },

  async deleteDraftsUpdatedBefore(ownerUserId: string, before: Date): Promise<void> {
    await prisma.classDraftRecord.deleteMany({
      where: { ownerUserId, updatedAt: { lt: before } },
    });
  },

  /** The server copy of unfinished creator work, newest first. */
  async listDrafts(ownerUserId: string): Promise<StoredClassDraft[]> {
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
    if (updated.count === 0) {
      return null;
    }
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

  async deleteDraftsForClasses(ownerUserId: string, classIds: number[]): Promise<void> {
    await prisma.classDraftRecord.deleteMany({
      where: { ownerUserId, classId: { in: classIds } },
    });
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

  async findWithText(id: number): Promise<CustomClassRows | null> {
    const cls = await prisma.class.findFirst({ where: { id, source: 'user' }, include: { owner: { select: { name: true } } } });
    if (!cls) {
      return null;
    }
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
          where: { key: { startsWith: `${customClassKeyRoot(id)}.` } },
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
    const text = (key: string | null) => localizedFrom(translations, key);
    const silverDice = cls.silverDice.length > 0 ? cls.silverDice : CLASSLESS_DEFAULTS.silverDice;
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
        hpDie: cls.hpDie ?? CLASSLESS_DEFAULTS.hpDie,
        omenDie: cls.omenDie,
        weaponDie: cls.weaponDie ?? CLASSLESS_DEFAULTS.weaponDie,
        armorDie: cls.armorDie ?? CLASSLESS_DEFAULTS.armorDie,
        silver: {
          count: silverDice.length,
          faces: silverDice[0],
          multiplier: cls.silverModifier ?? CLASSLESS_DEFAULTS.silverModifier,
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
            die: a.tableDie as TableDie,
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
    if (!current) {
      return null;
    }
    const latest = await prisma.class.findFirst({
      where: { lineageId: current.lineageId, source: 'user' },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    return latest ? this.findWithText(latest.id) : null;
  },

  /** Whether a character owner belongs to a party where this lineage is enabled. */
  async isVisibleToPartyMember(input: { lineageId: string; userId: string | null; sessionId: string | null }): Promise<boolean> {
    if (!input.userId && !input.sessionId) {
      return false;
    }
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
        takenDownAt: true,
        takedownReason: true,
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
    const texts = await translatedClassTexts(locale, rows);
    const summaries = rows.map((row, i) => {
      const text = texts[i];
      return {
        id: row.id,
        lineageId: row.lineageId,
        name: text.name,
        description: text.description,
        languages: row.languages,
        visibility: row.visibility,
        status: row.status,
        originCount: countByClass.get(row.id) ?? 0,
        takenDownAt: row.takenDownAt?.toISOString() ?? null,
        takedownReason: row.takedownReason,
      };
    });
    return summaries.sort((a, b) => b.id - a.id);
  },
};
