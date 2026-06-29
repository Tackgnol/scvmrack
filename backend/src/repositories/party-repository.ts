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

/** Thrown by {@link joinInTransaction} when the cap is hit inside the tx. */
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
  createParty(input: {
    ownerUserId: string;
    name: string;
    inviteToken: string;
  }): Promise<PartyRow> {
    return prisma.party.create({
      data: {
        ownerUserId: input.ownerUserId,
        name: input.name,
        inviteToken: input.inviteToken,
      },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        inviteToken: true,
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
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: { joinedAt: 'asc' },
          select: MEMBER_SELECT,
        },
      },
    });
  },

  getPartyByInviteToken(token: string): Promise<PartyRow | null> {
    return prisma.party.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        inviteToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  getCharacterForJoin(characterId: string): Promise<CharacterForJoinRow | null> {
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
      // Serialize all joins to THIS party. hashtextextended → a stable bigint
      // key from the party UUID; the lock is held until the tx commits.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.partyId}, 0))`;
      const count = await tx.character.count({
        where: { partyId: input.partyId },
      });
      if (count >= input.cap) {
        throw new PartyFullError();
      }
      await tx.character.update({
        where: { id: input.characterId },
        data: { partyId: input.partyId, joinedAt: new Date() },
      });
    });
  },

  async rotateInviteToken(id: string, token: string): Promise<void> {
    await prisma.party.update({
      where: { id },
      data: { inviteToken: token },
    });
  },

  async renameParty(id: string, name: string): Promise<void> {
    await prisma.party.update({ where: { id }, data: { name } });
  },

  async deleteParty(id: string): Promise<void> {
    await prisma.party.delete({ where: { id } });
  },
};
