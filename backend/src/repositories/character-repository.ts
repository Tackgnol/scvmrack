import prisma from '../lib/prisma.js';
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

  update(id: string, data: Prisma.CharacterUpdateInput): Promise<unknown> {
    return prisma.character.update({ where: { id }, data });
  },

  /** Stamp the Owlbear room a character is bound to (capability gate for cards). */
  setObrRoom(id: string, obrRoomId: string): Promise<unknown> {
    return prisma.character.update({ where: { id }, data: { obrRoomId } });
  },

  /**
   * The subset of `ids` whose stored Owlbear room matches `obrRoomId`. The PK
   * index serves the `id IN (...)` lookup; `obr_room_id` is a residual filter on
   * the (≤50) matched rows, so no extra index is needed.
   */
  async filterIdsInRoom(ids: string[], obrRoomId: string): Promise<string[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await prisma.character.findMany({
      where: { id: { in: ids }, obrRoomId },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  },

  deleteById(id: string): Promise<{ count: number }> {
    return prisma.character.deleteMany({ where: { id } });
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

  async classExists(id: number): Promise<boolean> {
    const row = await prisma.class.findUnique({
      where: { id },
      select: { id: true },
    });
    return row !== null;
  },

  /**
   * Classes for the creation gate: id + localized name/description.
   * Mirrors getClassNameMap's translation lookup.
   */
  async listClasses(
    locale: string
  ): Promise<Array<{ id: number; name: string | null; description: string | null }>> {
    const classes = await prisma.class.findMany({
      select: { id: true, nameKey: true, descriptionKey: true },
      orderBy: { id: 'asc' },
    });

    const keys = classes.flatMap((c) =>
      [c.nameKey, c.descriptionKey].filter((k): k is string => k !== null)
    );
    const translations =
      keys.length > 0
        ? await prisma.translation.findMany({
            where: { locale, key: { in: keys } },
            select: { key: true, value: true },
          })
        : [];
    const map = new Map(translations.map((t) => [t.key, t.value]));

    return classes.map((c) => ({
      id: c.id,
      name: c.nameKey ? (map.get(c.nameKey) ?? null) : null,
      description: c.descriptionKey ? (map.get(c.descriptionKey) ?? null) : null,
    }));
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
