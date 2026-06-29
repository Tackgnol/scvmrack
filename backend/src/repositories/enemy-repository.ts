import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

/** Enemy data-access layer. The ONLY place that talks to Prisma for enemies. */

export type EnemyRow = {
  id: string;
  partyId: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  playerDescription: string;
  currentHealth: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: unknown;
  specials: unknown;
  loot: unknown;
  statuses: unknown;
};

export type EnemyWriteData = {
  name: string;
  type: string;
  habitat: string;
  description: string;
  playerDescription: string;
  currentHealth: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: unknown;
  specials: unknown;
  loot: unknown;
  statuses: unknown;
};

const SELECT = {
  id: true,
  partyId: true,
  name: true,
  type: true,
  habitat: true,
  description: true,
  playerDescription: true,
  currentHealth: true,
  maxHealth: true,
  morale: true,
  armorDie: true,
  armorDescription: true,
  attacks: true,
  specials: true,
  loot: true,
  statuses: true,
} as const;

export const enemyRepository = {
  listByParty(partyId: string): Promise<EnemyRow[]> {
    return prisma.enemy.findMany({
      where: { partyId },
      orderBy: { createdAt: 'asc' },
      select: SELECT,
    }) as Promise<EnemyRow[]>;
  },

  create(partyId: string, data: EnemyWriteData): Promise<EnemyRow> {
    return prisma.enemy.create({
      data: { partyId, ...toPrismaJson(data) },
      select: SELECT,
    }) as Promise<EnemyRow>;
  },

  async update(
    enemyId: string,
    partyId: string,
    data: EnemyWriteData
  ): Promise<EnemyRow | null> {
    const result = await prisma.enemy.updateMany({
      where: { id: enemyId, partyId },
      data: toPrismaJson(data),
    });
    if (result.count === 0) {
      return null;
    }
    return prisma.enemy.findUnique({
      where: { id: enemyId },
      select: SELECT,
    }) as Promise<EnemyRow | null>;
  },

  async setHealth(
    enemyId: string,
    partyId: string,
    currentHealth: number
  ): Promise<EnemyRow | null> {
    const result = await prisma.enemy.updateMany({
      where: { id: enemyId, partyId },
      data: { currentHealth },
    });
    if (result.count === 0) {
      return null;
    }
    return prisma.enemy.findUnique({
      where: { id: enemyId },
      select: SELECT,
    }) as Promise<EnemyRow | null>;
  },

  async delete(enemyId: string, partyId: string): Promise<number> {
    const result = await prisma.enemy.deleteMany({
      where: { id: enemyId, partyId },
    });
    return result.count;
  },
};

function toPrismaJson(data: EnemyWriteData) {
  return {
    name: data.name,
    type: data.type,
    habitat: data.habitat,
    description: data.description,
    playerDescription: data.playerDescription,
    currentHealth: data.currentHealth,
    maxHealth: data.maxHealth,
    morale: data.morale,
    armorDie: data.armorDie,
    armorDescription: data.armorDescription,
    attacks: data.attacks as Prisma.InputJsonValue,
    specials: data.specials as Prisma.InputJsonValue,
    loot: data.loot as Prisma.InputJsonValue,
    statuses: data.statuses as Prisma.InputJsonValue,
  };
}
