import prisma from '../lib/prisma.js';
import { usableByWhere } from '../lib/class-model.js';
import type { GettingBetterRule } from '../lib/getting-better-types.js';
import type { ClassVersionRef } from '../lib/class-model.js';

/** One version of a class as stored, with its text still as translation keys. */
export type PoolCatalogSource = Omit<PoolCatalogRow, 'name' | 'blurb'> & {
  name: string;
  nameKey: string | null;
  descriptionKey: string | null;
  appendix: string | null;
};

/** One version of a class, as the GM's pool panel needs it. */
export type PoolCatalogRow = ClassVersionRef & {
  ownerName: string | null;
  name: string;
  blurb: string | null;
  languages: string[];
  credit: { work: string; author: string; url: string | null } | null;
  abilityCount: number;
  classItemCount: number;
  randomAbilityCount: number;
  gettingBetterRule: GettingBetterRule;
};

export type PartyPoolRow = {
  id: string;
  ownerUserId: string;
  classlessEnabled: boolean;
  poolLineageIds: string[];
  memberClassIds: Array<number | null>;
};

const poolClassSelect = {
  id: true,
  lineageId: true,
  version: true,
  source: true,
  status: true,
  visibility: true,
  ownerUserId: true,
  takenDownAt: true,
} as const;

/** Party Class Pool data access. */
export const classPoolRepository = {
  /** A party's pool, found by its id, invite token or Owlbear room. */
  async findPool(
    where: { id: string } | { inviteToken: string } | { obrRoomId: string }
  ): Promise<PartyPoolRow | null> {
    const party = await prisma.party.findUnique({
      where,
      select: {
        id: true,
        ownerUserId: true,
        classlessEnabled: true,
        classPool: { select: { lineageId: true } },
        members: { select: { classId: true } },
      },
    });
    if (!party) {
      return null;
    }
    return {
      id: party.id,
      ownerUserId: party.ownerUserId,
      classlessEnabled: party.classlessEnabled,
      poolLineageIds: party.classPool.map((row) => row.lineageId),
      memberClassIds: party.members.map((member) => member.classId),
    };
  },

  findBookClassRows(): Promise<ClassVersionRef[]> {
    return prisma.class.findMany({ where: { source: 'main_book' }, select: poolClassSelect });
  },

  /** Every version of the given class lineages. */
  findClassRowsByLineage(lineageIds: string[]): Promise<ClassVersionRef[]> {
    if (lineageIds.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.class.findMany({ where: { lineageId: { in: lineageIds } }, select: poolClassSelect });
  },

  async findBookLineageIds(): Promise<string[]> {
    const rows = await prisma.class.findMany({
      where: { source: 'main_book' },
      select: { lineageId: true },
      distinct: ['lineageId'],
    });
    return rows.map((row) => row.lineageId);
  },

  /**
   * Every version of the classes a GM's panel can show: built-in, the GM's own,
   * other GMs' public ones, and whatever is pooled already.
   */
  // ponytail: loads every public class; page or search server-side once public classes number in the hundreds.
  async findCatalogRows(ownerUserId: string, poolLineageIds: string[]): Promise<PoolCatalogSource[]> {
    const classes = await prisma.class.findMany({
      where: {
        OR: [...usableByWhere(ownerUserId).OR, { lineageId: { in: poolLineageIds } }],
      },
      select: {
        id: true,
        lineageId: true,
        version: true,
        source: true,
        status: true,
        visibility: true,
        ownerUserId: true,
        owner: { select: { name: true } },
        takenDownAt: true,
        name: true,
        nameKey: true,
        descriptionKey: true,
        appendix: true,
        languages: true,
        creditWork: true,
        creditAuthor: true,
        creditUrl: true,
        randomAbilityCount: true,
        gettingBetterRule: true,
      },
      orderBy: { id: 'asc' },
    });
    const byClass = {
      by: ['classId' as const],
      where: { classId: { in: classes.map((c) => c.id) } },
      _count: { _all: true as const },
    };
    const [abilityCounts, ...itemCounts] = await Promise.all([
      prisma.ability.groupBy(byClass),
      prisma.weapon.groupBy(byClass),
      prisma.armor.groupBy(byClass),
      prisma.equipment.groupBy(byClass),
      prisma.pet.groupBy(byClass),
    ]);
    const countByClass = new Map(abilityCounts.map((row) => [row.classId, row._count._all]));
    const itemsByClass = new Map<number, number>();
    for (const row of itemCounts.flat()) {
      if (row.classId !== null) {
        itemsByClass.set(row.classId, (itemsByClass.get(row.classId) ?? 0) + row._count._all);
      }
    }

    return classes.map((c) => ({
      id: c.id,
      lineageId: c.lineageId,
      version: c.version,
      source: c.source,
      status: c.status,
      visibility: c.visibility,
      ownerUserId: c.ownerUserId,
      ownerName: c.owner?.name ?? null,
      takenDownAt: c.takenDownAt,
      name: c.name,
      nameKey: c.nameKey,
      descriptionKey: c.descriptionKey,
      appendix: c.appendix,
      languages: c.languages,
      credit:
        c.creditWork && c.creditAuthor
          ? { work: c.creditWork, author: c.creditAuthor, url: c.creditUrl }
          : null,
      abilityCount: countByClass.get(c.id) ?? 0,
      classItemCount: itemsByClass.get(c.id) ?? 0,
      randomAbilityCount: c.randomAbilityCount ?? 0,
      gettingBetterRule: c.gettingBetterRule,
    }));
  },

  async setLineage(partyId: string, lineageId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      await prisma.partyClassPool.upsert({
        where: { partyId_lineageId: { partyId, lineageId } },
        create: { partyId, lineageId },
        update: {},
      });
    } else {
      await prisma.partyClassPool.deleteMany({ where: { partyId, lineageId } });
    }
  },

  async setClassless(partyId: string, enabled: boolean): Promise<void> {
    await prisma.party.update({ where: { id: partyId }, data: { classlessEnabled: enabled } });
  },
};
