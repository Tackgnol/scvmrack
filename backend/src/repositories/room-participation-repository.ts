import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { advisoryLock } from './advisory-lock.js';
import { randomUUID } from 'node:crypto';

function roomOps(tx: Prisma.TransactionClient, roomId: string) {
  return {
    getParty: () =>
      tx.party.findUnique({
        where: { obrRoomId: roomId },
        select: {
          id: true,
          ownerUserId: true,
          members: { select: { id: true } },
        },
      }),
    getCharacter: (id: string) =>
      tx.character.findUnique({
        where: { id },
        select: { id: true, userId: true, sessionId: true, partyId: true },
      }),
    getBindings: async () => {
      const players = await tx.obrPlayerCharacterBinding.findMany({
        where: { obrRoomId: roomId },
      });
      const tokens = await tx.obrTokenCharacterBinding.findMany({
        where: { obrRoomId: roomId },
      });
      return { players, tokens };
    },
    getCleanup: () =>
      tx.obrSceneCleanup.findMany({
        where: { roomId },
        orderBy: { id: 'asc' },
      }),
    getRemoval: (operationId: string) =>
      tx.obrRemoval.findUnique({
        where: { roomId_operationId: { roomId, operationId } },
      }),
    recordRemoval: (data: {
      operationId: string;
      characterId: string;
      actorId: string;
    }) => tx.obrRemoval.create({ data: { roomId, ...data } }),
    removeMembership: (characterId: string, partyId: string) =>
      tx.character.updateMany({
        where: { id: characterId, partyId },
        data: { partyId: null, joinedAt: null },
      }),
    removeBindings: async (characterId: string) => {
      await tx.obrPlayerCharacterBinding.deleteMany({
        where: { obrRoomId: roomId, characterId },
      });
      await tx.obrTokenCharacterBinding.deleteMany({
        where: { obrRoomId: roomId, characterId },
      });
    },
    addCleanup: (data: {
      operationId: string;
      characterId: string;
      tokenId: string;
      generation: string;
    }) => tx.obrSceneCleanup.create({ data: { roomId, ...data } }),
    acknowledgeCleanup: (id: string) =>
      tx.obrSceneCleanup.deleteMany({ where: { id, roomId } }),
    async setToken(input: {
      id: string;
      characterId: string;
      playerId?: string | null;
    }) {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: roomId },
        create: { obrRoomId: roomId },
        update: {},
      });
      return tx.obrTokenCharacterBinding.upsert({
        where: {
          obrRoomId_obrTokenId: { obrRoomId: roomId, obrTokenId: input.id },
        },
        create: {
          obrRoomId: roomId,
          obrTokenId: input.id,
          characterId: input.characterId,
          assignedPlayerId: input.playerId,
        },
        update: {
          characterId: input.characterId,
          assignedPlayerId: input.playerId ?? null,
          generation: randomUUID(),
        },
      });
    },
    async setPlayer(input: {
      id: string;
      characterId: string;
      connectionId?: string | null;
    }) {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: roomId },
        create: { obrRoomId: roomId },
        update: {},
      });
      return tx.obrPlayerCharacterBinding.upsert({
        where: {
          obrRoomId_obrPlayerId: { obrRoomId: roomId, obrPlayerId: input.id },
        },
        create: {
          obrRoomId: roomId,
          obrPlayerId: input.id,
          characterId: input.characterId,
          assignedByPlayerId: input.id,
          obrConnectionId: input.connectionId,
        },
        update: {
          characterId: input.characterId,
          assignedByPlayerId: input.id,
          obrConnectionId: input.connectionId ?? null,
        },
      });
    },
    clearToken: (id: string) =>
      tx.obrTokenCharacterBinding.deleteMany({
        where: { obrRoomId: roomId, obrTokenId: id },
      }),
    clearPlayer: (id: string) =>
      tx.obrPlayerCharacterBinding.deleteMany({
        where: { obrRoomId: roomId, obrPlayerId: id },
      }),
  };
}

export type RoomParticipationOps = ReturnType<typeof roomOps>;

export const roomParticipationRepository = {
  transaction<T>(
    roomId: string,
    run: (ops: RoomParticipationOps) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(async (tx) => {
      await advisoryLock(tx, 'room', roomId);
      return run(roomOps(tx, roomId));
    });
  },
};
