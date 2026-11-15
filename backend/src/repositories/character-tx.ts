import type { Prisma } from '@prisma/client';
import { advisoryLock } from './advisory-lock.js';

// Character shapes and transaction writes shared by the character, seat and room
// repositories; kept out of character-repository.ts so test fakes of that module
// do not break the other two.

/** The columns seat changes and binding checks reason about: who owns the scvm and which party it sits in. */
export const CHARACTER_MEMBERSHIP_SELECT = {
  id: true,
  userId: true,
  sessionId: true,
  partyId: true,
} as const;

export type CharacterMembershipRow = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  partyId: string | null;
};

/** Character writes bound to one transaction, so a service can combine them atomically. */
export function characterTxOps(tx: Prisma.TransactionClient) {
  return {
    async deleteCharactersOf(userId: string): Promise<void> {
      await tx.character.deleteMany({ where: { userId } });
    },

    async createCharacter(
      data: Prisma.CharacterUncheckedCreateInput
    ): Promise<string> {
      const character = await tx.character.create({
        data,
        select: { id: true },
      });
      return character.id;
    },

    /** Binds the Owlbear player's seat in the room to the character. */
    async bindObrPlayer(
      binding: { roomId: string; playerId: string },
      characterId: string
    ): Promise<void> {
      await advisoryLock(tx, 'room', binding.roomId);
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: binding.roomId },
        create: { obrRoomId: binding.roomId },
        update: { updatedAt: new Date() },
      });
      await tx.obrPlayerCharacterBinding.upsert({
        where: {
          obrRoomId_obrPlayerId: {
            obrRoomId: binding.roomId,
            obrPlayerId: binding.playerId,
          },
        },
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
