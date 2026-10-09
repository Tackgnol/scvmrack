import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * Party data-access layer. The ONLY place that talks to Prisma for party
 * reads/writes (and the character membership columns they touch). Holds no
 * business logic — all invariants live in `party-service.ts`.
 */

export type PartyRow = {
  id: string;
  name: string;
  ownerUserId: string;
  inviteToken: string;
  obrRoomId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PartyMemberRow = {
  id: string;
  name: string;
  classId: number | null;
  currentHp: number;
  maxHp: number;
  userId: string | null;
  sessionId: string | null;
  joinedAt: Date | null;
};

export type PartyWithMembers = PartyRow & { members: PartyMemberRow[] };

export type PartyInviteRow = {
  id: string;
  ownerUserId: string;
  classlessEnabled: boolean;
  poolLineageIds: string[];
};

/** Minimal character shape the join/leave/kick flows reason about. */
export type CharacterForJoinRow = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  partyId: string | null;
};

/** Thrown by {@link joinInTransaction} when the cap is hit inside the tx. */
/**
 * Serializes all joins to one party (a transaction-scoped advisory lock keyed on
 * its id, held until commit) and throws {@link PartyFullError} at the cap.
 */
async function lockPartyBelowCap(
  tx: Prisma.TransactionClient,
  partyId: string,
  cap: number,
  replaceUserId?: string
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${partyId}, 0))`;
  if (replaceUserId) {
    await tx.character.deleteMany({ where: { userId: replaceUserId } });
  }
  const count = await tx.character.count({ where: { partyId } });
  if (count >= cap) {
    throw new PartyFullError();
  }
}

export class PartyFullError extends Error {
  constructor() {
    super('Party is full');
    this.name = 'PartyFullError';
  }
}

const MEMBER_SELECT = {
  id: true,
  name: true,
  classId: true,
  currentHp: true,
  maxHp: true,
  userId: true,
  sessionId: true,
  joinedAt: true,
} as const;

export const partyRepository = {
  async ensureSystemUser(input: {
    id: string;
    name: string;
    email: string;
  }): Promise<void> {
    await prisma.user.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        name: input.name,
        email: input.email,
        emailVerified: true,
        isAnonymous: true,
      },
      update: {},
    });
  },

  /** Creates a party with the default Party Class Pool: every Book Class lineage. */
  createParty(input: {
    ownerUserId: string;
    name: string;
    inviteToken: string;
    obrRoomId?: string | null;
  }): Promise<PartyRow> {
    return prisma.$transaction(async (tx) => {
      const bookLineages = await tx.class.findMany({
        where: { source: 'main_book' },
        select: { lineageId: true },
        distinct: ['lineageId'],
      });
      return tx.party.create({
        data: {
          ownerUserId: input.ownerUserId,
          name: input.name,
          inviteToken: input.inviteToken,
          obrRoomId: input.obrRoomId ?? undefined,
          classPool: {
            create: bookLineages.map(({ lineageId }) => ({ lineageId })),
          },
        },
        select: {
          id: true,
          name: true,
          ownerUserId: true,
          inviteToken: true,
          obrRoomId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  },

  /** Parties owned by a GM, with a live member count, newest first. */
  async listPartiesByOwner(
    ownerUserId: string
  ): Promise<Array<PartyRow & { memberCount: number }>> {
    const rows = await prisma.party.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        inviteToken: true,
        obrRoomId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { members: true } },
      },
    });

    return rows.map((row) => {
      const { _count, ...rest } = row;
      return { ...rest, memberCount: _count.members };
    });
  },

  /** A party with its members ordered by join time. `null` when absent. */
  getPartyById(id: string): Promise<PartyWithMembers | null> {
    return prisma.party.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        inviteToken: true,
        obrRoomId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: { joinedAt: 'asc' },
          select: MEMBER_SELECT,
        },
      },
    });
  },

  /** Class ids whose lineage now has a newer version. */
  async findOlderClassIds(classIds: number[]): Promise<Set<number>> {
    if (classIds.length === 0) return new Set();
    const rows = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, lineageId: true, version: true },
    });
    const latest = await prisma.class.groupBy({
      by: ['lineageId'],
      where: { lineageId: { in: rows.map((row) => row.lineageId) } },
      _max: { version: true },
    });
    const latestByLineage = new Map(
      latest.map((row) => [row.lineageId, row._max.version])
    );
    return new Set(
      rows
        .filter(
          (row) =>
            row.version < (latestByLineage.get(row.lineageId) ?? row.version)
        )
        .map((row) => row.id)
    );
  },
  /** The party behind an invite link, with its Party Class Pool. */
  async findPartyForInvite(token: string): Promise<PartyInviteRow | null> {
    const party = await prisma.party.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        ownerUserId: true,
        classlessEnabled: true,
        classPool: { select: { lineageId: true } },
      },
    });
    if (!party) return null;
    const { classPool, ...rest } = party;
    return { ...rest, poolLineageIds: classPool.map((row) => row.lineageId) };
  },

  /** The Party Class Pool attached to an Owlbear room, if that room has a party. */
  async findPartyForObrRoom(obrRoomId: string): Promise<PartyInviteRow | null> {
    const party = await prisma.party.findUnique({
      where: { obrRoomId },
      select: {
        id: true,
        ownerUserId: true,
        classlessEnabled: true,
        classPool: { select: { lineageId: true } },
      },
    });
    if (!party) return null;
    const { classPool, ...rest } = party;
    return { ...rest, poolLineageIds: classPool.map((row) => row.lineageId) };
  },

  getPartyByInviteToken(token: string): Promise<PartyRow | null> {
    return prisma.party.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        inviteToken: true,
        obrRoomId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  getPartyByObrRoomId(obrRoomId: string): Promise<PartyWithMembers | null> {
    return prisma.party.findUnique({
      where: { obrRoomId },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        inviteToken: true,
        obrRoomId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: { joinedAt: 'asc' },
          select: MEMBER_SELECT,
        },
      },
    });
  },

  getCharacterForJoin(
    characterId: string
  ): Promise<CharacterForJoinRow | null> {
    return prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true, userId: true, sessionId: true, partyId: true },
    });
  },

  countMembers(partyId: string): Promise<number> {
    return prisma.character.count({ where: { partyId } });
  },

  /** Set (or clear) a character's party binding; keeps `joinedAt` in step. */
  async setCharacterParty(
    characterId: string,
    partyId: string | null
  ): Promise<void> {
    await prisma.character.update({
      where: { id: characterId },
      data: {
        partyId,
        joinedAt: partyId === null ? null : new Date(),
      },
    });
  },

  /**
   * Bind a character to a party with the cap enforced inside a transaction so
   * concurrent joins can never overflow it.
   *
   * The count→insert is a classic check-then-act race: under the default READ
   * COMMITTED isolation, two joins of different characters both read `cap - 1`,
   * both pass the guard, and each updates its own distinct row — no write-write
   * conflict, so both commit and the party overflows. We close the race with a
   * transaction-scoped Postgres advisory lock keyed on the party id: concurrent
   * joiners to the same party serialize on the lock (they queue rather than
   * abort/retry), so each runs its count→insert with an up-to-date count. The
   * lock auto-releases at transaction end. Throws {@link PartyFullError} when
   * the cap is reached (the service maps that to a 409).
   */
  async joinInTransaction(input: {
    characterId: string;
    partyId: string;
    cap: number;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await lockPartyBelowCap(tx, input.partyId, input.cap);
      await tx.character.update({
        where: { id: input.characterId },
        data: { partyId: input.partyId, joinedAt: new Date() },
      });
    });
  },

  /**
   * Creates a character already bound to the party, under the same advisory
   * lock and cap check as {@link joinInTransaction}: a full party creates
   * nothing. Throws {@link PartyFullError} at the cap.
   */
  async createMemberInTransaction(input: {
    partyId: string;
    cap: number;
    data: Prisma.CharacterUncheckedCreateInput;
    obrBinding?: { roomId: string; playerId: string };
    replaceUserId?: string;
  }): Promise<string> {
    return prisma.$transaction(async (tx) => {
      await lockPartyBelowCap(tx, input.partyId, input.cap, input.replaceUserId);
      const character = await tx.character.create({
        data: { ...input.data, partyId: input.partyId, joinedAt: new Date() },
        select: { id: true },
      });
      if (input.obrBinding) {
        await tx.obrRoomBinding.upsert({
          where: { obrRoomId: input.obrBinding.roomId },
          create: { obrRoomId: input.obrBinding.roomId },
          update: { updatedAt: new Date() },
        });
        await tx.obrPlayerCharacterBinding.upsert({
          where: {
            obrRoomId_obrPlayerId: {
              obrRoomId: input.obrBinding.roomId,
              obrPlayerId: input.obrBinding.playerId,
            },
          },
          create: {
            obrRoomId: input.obrBinding.roomId,
            obrPlayerId: input.obrBinding.playerId,
            characterId: character.id,
            assignedByPlayerId: input.obrBinding.playerId,
          },
          update: {
            characterId: character.id,
            assignedByPlayerId: input.obrBinding.playerId,
          },
        });
      }
      return character.id;
    });
  },

  async rotateInviteToken(id: string, token: string): Promise<void> {
    await prisma.party.update({
      where: { id },
      data: { inviteToken: token },
    });
  },

  /** Replaces an empty system-owned room party without dropping the room's Party Class Pool on the incoming party. */
  async replaceEmptySystemPartyInRoom(input: {
    roomId: string;
    systemPartyId: string;
    partyId: string;
    systemOwnerUserId: string;
  }): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const systemParty = await tx.party.findUnique({
        where: { obrRoomId: input.roomId },
        select: {
          id: true,
          ownerUserId: true,
          _count: { select: { members: true } },
        },
      });
      if (
        !systemParty ||
        systemParty.id !== input.systemPartyId ||
        systemParty.ownerUserId !== input.systemOwnerUserId ||
        systemParty._count.members > 0
      ) {
        return false;
      }
      await tx.party.delete({ where: { id: systemParty.id } });
      await tx.party.update({
        where: { id: input.partyId },
        data: { obrRoomId: input.roomId },
      });
      return true;
    });
  },

  /** Transfer party ownership (used when a signed-in GM claims a system-owned room party). */
  async setPartyOwner(id: string, ownerUserId: string): Promise<void> {
    await prisma.party.update({ where: { id }, data: { ownerUserId } });
  },

  /** Re-point (or clear) the party's Owlbear room pointer (D2: 1:1, re-pointable). */
  async setPartyObrRoom(id: string, obrRoomId: string | null): Promise<void> {
    await prisma.party.update({ where: { id }, data: { obrRoomId } });
  },

  async renameParty(id: string, name: string): Promise<void> {
    await prisma.party.update({ where: { id }, data: { name } });
  },

  async setPartyMiseryCount(
    partyId: string,
    miseryCount: number
  ): Promise<string[]> {
    const characters = await prisma.character.updateManyAndReturn({
      where: { partyId },
      data: { miseryCount },
      select: { id: true },
    });
    return characters.map(({ id }) => id);
  },

  async deleteParty(id: string): Promise<void> {
    await prisma.party.delete({ where: { id } });
  },
};
