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
  createdAt: Date;
  updatedAt: Date;
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

  update(id: string, data: Prisma.CharacterUpdateInput): Promise<unknown> {
    return prisma.character.update({ where: { id }, data });
  },

  deleteById(id: string): Promise<{ count: number }> {
    return prisma.character.deleteMany({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.character.count();
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
