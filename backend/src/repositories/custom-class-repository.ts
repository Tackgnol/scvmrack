import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import {
  advisoryLock,
  deleteVersion,
  lineageTxOps,
  readVersionDraft,
  writeVersion,
} from './class-version-repository.js';
import type { ClassDraft } from '../lib/class-draft.js';
import { versionColumns } from '../lib/class-version.js';
import type { ClassStatus, ClassVersionRef, ClassVisibility } from '../lib/class-model.js';

type Tx = Prisma.TransactionClient;

/** A saved Custom Class with every language's text, as the creator reloads it. */
export type CustomClassRows = ClassVersionRef & {
  ownerUserId: string | null;
  ownerName: string | null;
  visibility: ClassVisibility;
  version: number;
  status: ClassStatus;
  takenDownAt: Date | null;
  takedownReason: string | null;
  isLatest: boolean;
  playingCount: number;
  draft: ClassDraft;
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
/** Lineage reads and writes bound to one transaction, so a service can combine them atomically. */
function lineageOps(tx: Tx) {
  return {
    ...lineageTxOps(tx),
    /** Serializes this owner's publishes and class creations until the transaction ends. */
    async lockOwner(ownerUserId: string): Promise<void> {
      await advisoryLock(tx, 'owner', ownerUserId);
    },

    async findPublishState(id: number) {
      return tx.class.findUniqueOrThrow({
        where: { id },
        select: { lineageId: true, visibility: true, firstPublishedAt: true, takenDownAt: true },
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

    /**
     * Locks a version's row until the transaction ends. Creating a character takes a
     * key-share lock on its class row (the foreign key), so this also waits for any
     * scvm being rolled on the version and blocks new ones until the save commits.
     */
    async lockVersion(id: number): Promise<void> {
      await tx.$executeRaw`SELECT id FROM classes WHERE id = ${id} FOR UPDATE`;
    },

    /** The versions among `ids` that a moderation report or log entry refers to. */
    async moderatedVersionIds(ids: number[]): Promise<Set<number>> {
      const [reports, logs] = await Promise.all([
        tx.moderationReport.findMany({ where: { classId: { in: ids } }, select: { classId: true } }),
        tx.moderationLog.findMany({ where: { classId: { in: ids } }, select: { classId: true } }),
      ]);
      return new Set([...reports, ...logs].flatMap((row) => (row.classId === null ? [] : [row.classId])));
    },

    /** Custom Classes (lineages) the account holds, archived included. */
    async countOwnedLineages(ownerUserId: string): Promise<number> {
      const rows = await tx.class.findMany({
        where: { source: 'user', ownerUserId },
        distinct: ['lineageId'],
        select: { lineageId: true },
      });
      return rows.length;
    },

    async findVersionRow(id: number) {
      return tx.class.findUniqueOrThrow({
        where: { id },
        select: {
          source: true,
          ownerUserId: true,
          visibility: true,
          firstPublishedAt: true,
          lineageId: true,
          version: true,
          takenDownAt: true,
        },
      });
    },

    /** Writes a new version row from `fields` and `draft`; a new lineage when `fields` has no `lineageId`. */
    async insertVersion(
      fields: Pick<Prisma.ClassUncheckedCreateInput, 'source' | 'ownerUserId' | 'visibility' | 'status' | 'firstPublishedAt' | 'lineageId' | 'version'>,
      draft: ClassDraft
    ): Promise<number> {
      const { id } = await tx.class.create({
        data: { ...versionColumns(draft), ...fields },
        select: { id: true },
      });
      await writeVersion(tx, id, draft);
      return id;
    },

    /** Rewrites a version in place from `draft`. */
    async updateVersion(id: number, draft: ClassDraft): Promise<void> {
      await tx.class.update({ where: { id }, data: versionColumns(draft) });
      await writeVersion(tx, id, draft);
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
  async findWithText(id: number): Promise<CustomClassRows | null> {
    const cls = await prisma.class.findFirst({ where: { id, source: 'user' }, include: { owner: { select: { name: true } } } });
    if (!cls) {
      return null;
    }
    const [latest, playingCount, draft] = await Promise.all([
      prisma.class.aggregate({ where: { lineageId: cls.lineageId }, _max: { version: true } }),
      prisma.character.count({ where: { classId: id } }),
      readVersionDraft(prisma, cls),
    ]);
    return {
      id: cls.id,
      lineageId: cls.lineageId,
      source: cls.source,
      ownerUserId: cls.ownerUserId,
      ownerName: cls.owner?.name ?? null,
      visibility: cls.visibility,
      version: cls.version,
      status: cls.status,
      takenDownAt: cls.takenDownAt,
      takedownReason: cls.takedownReason,
      isLatest: latest._max.version === cls.version,
      playingCount,
      draft,
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
  /** The account's Custom Classes at their latest version, with untranslated text keys and origin counts. */
  async listOwned(ownerUserId: string) {
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
        firstPublishedAt: true,
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
    return rows.map((row) => ({ ...row, originCount: countByClass.get(row.id) ?? 0 }));
  },
};
