import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import type { AbilityGrants } from '../lib/class-grants.js';
import type { AbilityOrder } from '../lib/ability-order.js';
import type { GettingBetterRule } from '../lib/getting-better-types.js';

export type ImprovementCharacterRow = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  classId: number | null;
  maxHp: number;
  silver: number | null;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  abilities: unknown;
  equipment: unknown;
  updatedAt: Date;
  partyId: string | null;
};

export type CharacterImprovementRow = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: unknown;
  applied: unknown | null;
  snapshotHash: string;
  createdAt: Date;
  updatedAt: Date;
  appliedAt: Date | null;
};

export type ClassAbilityRow = AbilityGrants & AbilityOrder & {
  key: string;
  isRandom: boolean | null;
};

export type ClassGettingBetterRow = {
  gettingBetterRule: GettingBetterRule;
  gettingBetterNoteKey: string | null;
  languages: string[];
};

export type LatestClassImprovementCatalogRow = ClassGettingBetterRow & {
  abilities: ClassAbilityRow[];
};

export type ScrollCatalogRow = {
  key: string;
  roll: number | null;
  tags: string[];
};

export type ApplyImprovementInput = {
  characterId: string;
  improvementId: string;
  characterData: Prisma.CharacterUpdateInput;
  applied: Prisma.InputJsonValue;
};

export const characterImprovementRepository = {
  getCharacterForImprovement(
    characterId: string
  ): Promise<ImprovementCharacterRow | null> {
    return prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        userId: true,
        sessionId: true,
        classId: true,
        maxHp: true,
        silver: true,
        strength: true,
        agility: true,
        presence: true,
        toughness: true,
        abilities: true,
        equipment: true,
        updatedAt: true,
        partyId: true,
      },
    }) as Promise<ImprovementCharacterRow | null>;
  },

  findActive(characterId: string): Promise<CharacterImprovementRow | null> {
    return prisma.characterImprovement.findFirst({
      where: { characterId, appliedAt: null },
      orderBy: { createdAt: 'desc' },
    }) as Promise<CharacterImprovementRow | null>;
  },

  findActiveById(
    characterId: string,
    improvementId: string
  ): Promise<CharacterImprovementRow | null> {
    return prisma.characterImprovement.findFirst({
      where: { id: improvementId, characterId, appliedAt: null },
    }) as Promise<CharacterImprovementRow | null>;
  },

  countApplied(characterId: string): Promise<number> {
    return prisma.characterImprovement.count({
      where: { characterId, appliedAt: { not: null } },
    });
  },

  createActive(
    characterId: string,
    sequence: number,
    rolledDraft: Prisma.InputJsonValue,
    snapshotHash: string
  ): Promise<CharacterImprovementRow> {
    return prisma.characterImprovement.create({
      data: {
        characterId,
        sequence,
        rolledDraft,
        snapshotHash,
      },
    }) as Promise<CharacterImprovementRow>;
  },

  async updateRolledDraft(
    characterId: string,
    improvementId: string,
    rolledDraft: Prisma.InputJsonValue,
    snapshotHash: string
  ): Promise<CharacterImprovementRow | null> {
    const result = await prisma.characterImprovement.updateMany({
      where: { id: improvementId, characterId, appliedAt: null },
      data: { rolledDraft, snapshotHash },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findActiveById(characterId, improvementId);
  },

  findScrolls(kind: 'sacred' | 'unclean'): Promise<ScrollCatalogRow[]> {
    return prisma.equipment.findMany({
      where: { tags: { hasEvery: ['scroll', kind] } },
      select: { key: true, roll: true, tags: true },
      orderBy: { roll: 'asc' },
    }) as Promise<ScrollCatalogRow[]>;
  },

  async findLatestClassCatalog(
    classId: number
  ): Promise<LatestClassImprovementCatalogRow | null> {
    const current = await prisma.class.findUnique({
      where: { id: classId },
      select: { lineageId: true },
    });
    if (!current) {
      return null;
    }

    const latest = await prisma.class.findFirst({
      where: { lineageId: current.lineageId },
      orderBy: { version: 'desc' },
      select: { id: true, gettingBetterRule: true, gettingBetterNoteKey: true, languages: true },
    });
    if (!latest) {
      return null;
    }

    const abilities = await prisma.ability.findMany({
      where: { classId: latest.id },
      select: { key: true, position: true, id: true, isRandom: true, grantItemKey: true, grantPetKey: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    }) as ClassAbilityRow[];
    return { ...latest, abilities };
  },

  async applyInTransaction(input: ApplyImprovementInput): Promise<
    | { applied: true; partyId: string | null }
    | { applied: false }
  > {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const improvement = await tx.characterImprovement.updateMany({
        where: {
          id: input.improvementId,
          characterId: input.characterId,
          appliedAt: null,
        },
        data: {
          applied: input.applied,
          appliedAt: now,
        },
      });

      if (improvement.count === 0) {
        return { applied: false };
      }

      const character = await tx.character.update({
        where: { id: input.characterId },
        data: input.characterData,
        select: { partyId: true },
      });

      return { applied: true, partyId: character.partyId };
    });
  },
};
