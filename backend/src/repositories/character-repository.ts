import prisma from '../lib/prisma.js';
import { advisoryLock } from './advisory-lock.js';
import { Prisma } from '@prisma/client';

/**
 * Character data-access layer. The ONLY place that talks to Prisma for character
 * (and character-list localization) reads/writes. Holds no business logic.
 */

export type CharacterSummaryRow = {
  id: string;
  name: string;
  classId: number | null;
  currentHp: number;
  maxHp: number;
  partyId: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CharacterPartyAccessRow = {
  userId: string | null;
  sessionId: string | null;
  partyId: string | null;
  party: {
    ownerUserId: string;
    members: Array<{
      userId: string | null;
      sessionId: string | null;
    }>;
  } | null;
};

/** Character writes bound to one transaction, so a service can combine them atomically. */
function characterTxOps(tx: Prisma.TransactionClient) {
  return {
    /** Serializes work on one party (joins against its member cap) until the transaction ends. */
    lockParty(partyId: string): Promise<void> {
      return advisoryLock(tx, 'party', partyId);
    },

    /** How many scvm are in the party, not counting `excludingUserId`'s. */
    countPartyMembers(partyId: string, excludingUserId?: string): Promise<number> {
      return tx.character.count({
        where: {
          partyId,
          // NOT alone would also skip owner-less scvm (user_id NULL), which still hold a seat.
          ...(excludingUserId ? { OR: [{ userId: null }, { NOT: { userId: excludingUserId } }] } : {}),
        },
      });
    },

    async deleteCharactersOf(userId: string): Promise<void> {
      await tx.character.deleteMany({ where: { userId } });
    },

    async createCharacter(data: Prisma.CharacterUncheckedCreateInput): Promise<string> {
      const character = await tx.character.create({ data, select: { id: true } });
      return character.id;
    },

    async joinParty(characterId: string, partyId: string): Promise<void> {
      await tx.character.update({ where: { id: characterId }, data: { partyId, joinedAt: new Date() } });
    },

    /** Binds the Owlbear player's seat in the room to the character. */
    async bindObrPlayer(binding: { roomId: string; playerId: string }, characterId: string): Promise<void> {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: binding.roomId },
        create: { obrRoomId: binding.roomId },
        update: { updatedAt: new Date() },
      });
      await tx.obrPlayerCharacterBinding.upsert({
        where: { obrRoomId_obrPlayerId: { obrRoomId: binding.roomId, obrPlayerId: binding.playerId } },
        create: {
          obrRoomId: binding.roomId,
          obrPlayerId: binding.playerId,
          characterId,
          assignedByPlayerId: binding.playerId,
        },
        update: { characterId, assignedByPlayerId: binding.playerId },
      });
    },
  };
}

export type CharacterTxOps = ReturnType<typeof characterTxOps>;

export const characterRepository = {
  /** Owner lookup for ownership checks. `null` when the row does not exist. */
  getOwnerId(id: string): Promise<{ userId: string | null } | null> {
    return prisma.character.findUnique({
      where: { id },
      select: { userId: true },
    });
  },

  /** The save id of the last guarded update, or null when the character is gone. */
  getLastSaveId(id: string): Promise<{ lastSaveId: string | null } | null> {
    return prisma.character.findUnique({
      where: { id },
      select: { lastSaveId: true },
    });
  },

  getPresence(id: string): Promise<{ presence: number } | null> {
    return prisma.character.findUnique({
      where: { id },
      select: { presence: true },
    });
  },

  getPartyId(id: string): Promise<{ partyId: string | null } | null> {
    return prisma.character.findUnique({
      where: { id },
      select: { partyId: true },
    });
  },

  transferOwnership(id: string, userId: string): Promise<unknown> {
    return prisma.character.update({
      where: { id },
      data: { userId, sessionId: null },
    });
  },

  getPartyAccessContext(id: string): Promise<CharacterPartyAccessRow | null> {
    return prisma.character.findUnique({
      where: { id },
      select: {
        userId: true,
        sessionId: true,
        partyId: true,
        party: {
          select: {
            ownerUserId: true,
            members: {
              select: {
                userId: true,
                sessionId: true,
              },
            },
          },
        },
      },
    });
  },

  getObrBindingAccessContext(id: string) {
    return prisma.character.findUnique({
      where: { id },
      select: {
        userId: true,
        sessionId: true,
        party: { select: { ownerUserId: true, obrRoomId: true } },
      },
    });
  },

  /** Ids from `ids` whose character belongs to the party attached to this OBR room. */
  async filterCharacterIdsInRoomParty(
    ids: string[],
    roomId: string
  ): Promise<string[]> {
    const rows = await prisma.character.findMany({
      where: { id: { in: ids }, party: { obrRoomId: roomId } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  },

  update(
    id: string,
    data: Prisma.CharacterUpdateInput,
    guard?: { expectedUpdatedAt?: Date; saveId?: string }
  ): Promise<unknown> {
    const { expectedUpdatedAt, saveId } = guard ?? {};
    if (saveId) {
      data = { ...data, lastSaveId: saveId };
    }
    if (!expectedUpdatedAt) {
      return prisma.character.update({ where: { id }, data });
    }
    const nextMillisecond = new Date(expectedUpdatedAt.getTime() + 1);
    return prisma.character.update({
      // SQL-era timestamps have microseconds; API dates serialize milliseconds.
      where: { id, updatedAt: { gte: expectedUpdatedAt, lt: nextMillisecond } },
      data: {
        ...data,
        updatedAt: new Date(Math.max(Date.now(), nextMillisecond.getTime())),
      },
    });
  },

  deleteById(id: string): Promise<{ count: number }> {
    return prisma.character.deleteMany({ where: { id } });
  },

  /** Runs `work` in one transaction with the character write operations bound to it. */
  transaction<T>(work: (ops: CharacterTxOps) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => work(characterTxOps(tx)));
  },

  /** True if the user already owns at least one character. */
  async userHasCharacters(userId: string): Promise<boolean> {
    const row = await prisma.character.findFirst({
      where: { userId },
      select: { id: true },
    });
    return row !== null;
  },

  /**
   * Delete every character owned by `userId` except `keepId`. Enforces the
   * one-scvm-per-guest invariant when an anonymous session opts into replacing
   * its existing scvm (see character-service generate).
   */
  deleteOthersForUser(userId: string, keepId: string): Promise<{ count: number }> {
    return prisma.character.deleteMany({
      where: { userId, id: { not: keepId } },
    });
  },

  findFullRow(id: string) {
    return prisma.character.findUnique({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.character.count();
  },

  /** Classes for the creation gate with their untranslated text keys, in id order. */
  async listClassesByIds(ids: number[]) {
    if (ids.length === 0) {
      return [];
    }
    return prisma.class.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, nameKey: true, descriptionKey: true, languages: true },
      orderBy: { id: 'asc' },
    });
  },

  listSummariesByUser(userId: string): Promise<CharacterSummaryRow[]> {
    return prisma.character.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        classId: true,
        currentHp: true,
        maxHp: true,
        partyId: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /** Localized class display names for the given class ids. */
  async getClassNameMap(
    classIds: number[],
    locale: string
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    if (classIds.length === 0) {
      return map;
    }

    const classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, nameKey: true },
    });

    const nameKeys = classes
      .map((c) => c.nameKey)
      .filter((k): k is string => k !== null);
    const translations =
      nameKeys.length > 0
        ? await prisma.translation.findMany({
            where: { locale, key: { in: nameKeys } },
            select: { key: true, value: true },
          })
        : [];

    const translationMap = new Map(translations.map((t) => [t.key, t.value]));
    for (const cls of classes) {
      map.set(
        cls.id,
        (cls.nameKey ? translationMap.get(cls.nameKey) : null) ?? cls.name
      );
    }
    return map;
  },
};
