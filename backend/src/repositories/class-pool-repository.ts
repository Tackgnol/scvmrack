import prisma from '../lib/prisma.js';
import { findTranslationsWithAuthoredFallback } from '../lib/class-translations.js';
import type { GettingBetterRule } from '../lib/getting-better-types.js';
import type { ClassVersionRef } from '../lib/class-model.js';

/** One version of a class, as the GM's pool panel needs it. */
export type PoolCatalogRow = ClassVersionRef & {
  ownerName: string | null;
  name: string;
  blurb: string | null;
  languages: string[];
  credit: { work: string; author: string; url: string | null } | null;
  abilityCount: number;
  randomAbilityCount: number;
  gettingBetterRule: GettingBetterRule;
};

export type PartyPoolRow = {
  ownerUserId: string;
  classlessEnabled: boolean;
  poolLineageIds: string[];
  memberClassIds: Array<number | null>;
};

/** Party Class Pool data access. */
export const classPoolRepository = {
  async findPartyPool(partyId: string): Promise<PartyPoolRow | null> {
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      select: {
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
      ownerUserId: party.ownerUserId,
      classlessEnabled: party.classlessEnabled,
      poolLineageIds: party.classPool.map((row) => row.lineageId),
      memberClassIds: party.members.map((member) => member.classId),
    };
  },

  /**
   * Every version of the classes a GM's panel can show: built-in, the GM's own,
   * other GMs' public ones, and whatever is pooled already.
   */
  // ponytail: loads every public class; page or search server-side once public classes number in the hundreds.
  async findCatalogRows(
    ownerUserId: string,
    poolLineageIds: string[],
    locale: string
  ): Promise<PoolCatalogRow[]> {
    const classes = await prisma.class.findMany({
      where: {
        OR: [
          { source: { not: 'user' } },
          { ownerUserId },
          { visibility: 'public' },
          { lineageId: { in: poolLineageIds } },
        ],
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
    const abilityCounts = await prisma.ability.groupBy({
      by: ['classId'],
      where: { classId: { in: classes.map((c) => c.id) } },
      _count: { _all: true },
    });
    const countByClass = new Map(abilityCounts.map((row) => [row.classId, row._count._all]));

    return Promise.all(
      classes.map(async (c) => {
        const keys = [c.nameKey, c.descriptionKey].filter((k): k is string => k !== null);
        const text = await findTranslationsWithAuthoredFallback(locale, c.languages, keys);
        return {
          id: c.id,
          lineageId: c.lineageId,
          version: c.version,
          source: c.source,
          status: c.status,
          visibility: c.visibility,
          ownerUserId: c.ownerUserId,
          ownerName: c.owner?.name ?? null,
          takenDownAt: c.takenDownAt,
          name: (c.nameKey ? text.get(c.nameKey) : undefined) ?? c.name,
          blurb: (c.descriptionKey ? text.get(c.descriptionKey) : undefined) ?? c.appendix,
          languages: c.languages,
          credit:
            c.creditWork && c.creditAuthor
              ? { work: c.creditWork, author: c.creditAuthor, url: c.creditUrl }
              : null,
          abilityCount: countByClass.get(c.id) ?? 0,
          randomAbilityCount: c.randomAbilityCount ?? 0,
          gettingBetterRule: c.gettingBetterRule,
        };
      })
    );
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
