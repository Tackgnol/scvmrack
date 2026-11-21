import type { Prisma } from '@prisma/client';
import type { Roller } from '@tackgnol/rpg-tools-roller';
import {
  rollCharacter,
  rollQuickCharacter,
  type BuildCharacterOptions,
  type CharacterData,
} from '../lib/generate-character.js';
import {
  seededRollerFor,
  type CharacterDraft,
  type RollerFor,
} from '../lib/draft-seeds.js';
import { characterCreateInput } from '../repositories/character-repository.js';
import { rollInputsRepository } from '../repositories/roll-inputs-repository.js';
import { sanitizeString } from '../utils.js';

/** Loads what a roll of `classId` needs (null rolls classless) and rolls one scvm, persisting nothing. */
export async function rollCharacterData(
  classId: number | null,
  rollerFor: RollerFor,
  options: BuildCharacterOptions = {},
): Promise<CharacterData> {
  return rollCharacter(await rollInputsRepository.load(classId), rollerFor, options);
}

/** Builds one random scvm row without persisting it, for an atomic party join. */
export async function randomCharacterCreateData(
  classId: number | null,
  roller: Roller,
  userId?: string,
): Promise<Prisma.CharacterUncheckedCreateInput> {
  const data = await rollQuickCharacter(await rollInputsRepository.load(classId), roller);
  return characterCreateInput(data, userId);
}

/** The row a confirmed draft rebuilds to, ready to insert (alone or as a party member). */
export async function characterCreateDataFromDraft(
  draft: CharacterDraft,
  userId: string,
): Promise<Prisma.CharacterUncheckedCreateInput> {
  const data = await rollCharacterData(
    draft.classless ? null : draft.classId,
    seededRollerFor(draft.seeds),
    { dropLowestAbilities: draft.dropLowestAbilities },
  );
  const nameOverride = sanitizeString(draft.name, 255);
  if (nameOverride.length > 0) {
    data.name = nameOverride;
  }
  return characterCreateInput(data, userId);
}
