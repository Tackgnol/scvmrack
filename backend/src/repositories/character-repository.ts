import prisma from '../lib/prisma.js';
import { translatedClassTexts } from '../lib/class-translations.js';
import { Prisma } from '@prisma/client';
import type { ClassVersionRef } from '../lib/class-model.js';

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

const scopeClassSelect = {
  id: true,
  lineageId: true,
  version: true,
  source: true,
  status: true,
  visibility: true,
  ownerUserId: true,
  takenDownAt: true,
} as const;

export const characterRepository = {
  /** Owner lookup for ownership checks. `null` when the row does not exist. */
  getOwnerId(id: string): Promise<{ userId: string | null } | null> {
    return prisma.character.findUnique({
      where: { id },
      select: { userId: true },
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

  update(id: string, data: Prisma.CharacterUpdateInput): Promise<unknown> {
    return prisma.character.update({ where: { id }, data });
  },

  deleteById(id: string): Promise<{ count: number }> {
    return prisma.character.deleteMany({ where: { id } });
  },

  /** Creates and binds a room-scoped scvm in one transaction. */
  async createWithObrBindingInTransaction(input: {
    data: Prisma.CharacterUncheckedCreateInput;
    obrBinding: { roomId: string; playerId: string };
    replaceUserId?: string;
  }): Promise<string> {
    return prisma.$transaction(async (tx) => {
      if (input.replaceUserId) {
        await tx.character.deleteMany({ where: { userId: input.replaceUserId } });
      }
      const character = await tx.character.create({
        data: input.data,
        select: { id: true },
      });
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
      return character.id;
    });
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

  /** Every Book Class row, for the solo (no-party) class scope. */
  findBookClassRows(): Promise<ClassVersionRef[]> {
    return prisma.class.findMany({ where: { source: 'main_book' }, select: scopeClassSelect });
  },

  /** Every version of the given class lineages, for a Party Class Pool. */
  findClassRowsByLineage(lineageIds: string[]): Promise<ClassVersionRef[]> {
    if (lineageIds.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.class.findMany({ where: { lineageId: { in: lineageIds } }, select: scopeClassSelect });
  },

  /**
   * Classes for the creation gate: id + localized name/description, in id order.
   * One-language classes fall back to their authored language.
   */
  async listClassesByIds(
    ids: number[],
    locale: string
  ): Promise<Array<{ id: number; name: string | null; description: string | null }>> {
    if (ids.length === 0) {
      return [];
    }
    const classes = await prisma.class.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, nameKey: true, descriptionKey: true, languages: true },
      orderBy: { id: 'asc' },
    });

    const texts = await translatedClassTexts(locale, classes);
    return classes.map((c, i) => ({ id: c.id, ...texts[i] }));
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
