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

/** Minimal character shape the join/leave/kick flows reason about. */
export type CharacterForJoinRow = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  partyId: string | null;
};

/** Room-party reads and writes bound to one transaction, so a service can combine them atomically. */
function roomOps(tx: Prisma.TransactionClient) {
  return {
    findRoomParty(roomId: string) {
      return tx.party.findUnique({
        where: { obrRoomId: roomId },
        select: { id: true, ownerUserId: true, _count: { select: { members: true } } },
      });
    },

    async deleteParty(id: string): Promise<void> {
      await tx.party.delete({ where: { id } });
    },

    async setPartyRoom(id: string, roomId: string): Promise<void> {
      await tx.party.update({ where: { id }, data: { obrRoomId: roomId } });
    },
  };
}

export type RoomOps = ReturnType<typeof roomOps>;

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

  /** Creates a party with `poolLineageIds` as its Party Class Pool. */
  createParty(input: {
    ownerUserId: string;
    name: string;
    inviteToken: string;
    obrRoomId?: string | null;
    poolLineageIds: string[];
  }): Promise<PartyRow> {
    return prisma.party.create({
      data: {
        ownerUserId: input.ownerUserId,
        name: input.name,
        inviteToken: input.inviteToken,
        obrRoomId: input.obrRoomId ?? undefined,
        classPool: {
          create: input.poolLineageIds.map((lineageId) => ({ lineageId })),
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

  /** Each class version's number and the newest version number of its lineage. */
  async findClassVersions(classIds: number[]): Promise<Map<number, { version: number; latestVersion: number }>> {
    if (classIds.length === 0) {
      return new Map();
    }
    const rows = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, lineageId: true, version: true },
    });
    const latest = await prisma.class.groupBy({
      by: ['lineageId'],
      where: { lineageId: { in: rows.map((row) => row.lineageId) } },
      _max: { version: true },
    });
    const latestByLineage = new Map(latest.map((row) => [row.lineageId, row._max.version ?? 0]));
    return new Map(
      rows.map((row) => [row.id, { version: row.version, latestVersion: latestByLineage.get(row.lineageId) ?? row.version }])
    );
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

  async rotateInviteToken(id: string, token: string): Promise<void> {
    await prisma.party.update({
      where: { id },
      data: { inviteToken: token },
    });
  },

  /** Runs `work` in one transaction with the room-party operations bound to it. */
  roomTransaction<T>(work: (ops: RoomOps) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => work(roomOps(tx)));
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
