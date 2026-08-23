import type { ObrBindingsDb } from '@tackgnol/rpgtools-owlbear/server';
import prisma from './prisma.js';

const playerBindingSelect = {
  obrRoomId: true,
  obrPlayerId: true,
  obrConnectionId: true,
  characterId: true,
  assignedByPlayerId: true,
} as const;

const tokenBindingSelect = {
  obrRoomId: true,
  obrTokenId: true,
  assignedPlayerId: true,
  characterId: true,
} as const;

function toPlayerRow(row: {
  obrRoomId: string;
  obrPlayerId: string;
  obrConnectionId: string | null;
  characterId: string;
  assignedByPlayerId: string;
}) {
  return {
    roomId: row.obrRoomId,
    playerId: row.obrPlayerId,
    connectionId: row.obrConnectionId,
    characterId: row.characterId,
    assignedByPlayerId: row.assignedByPlayerId,
  };
}

function toTokenRow(row: {
  obrRoomId: string;
  obrTokenId: string;
  assignedPlayerId: string | null;
  characterId: string;
}) {
  return {
    roomId: row.obrRoomId,
    tokenId: row.obrTokenId,
    playerId: row.assignedPlayerId,
    characterId: row.characterId,
  };
}

export const obrBindingsDb: ObrBindingsDb = {
  async getBindings(roomId) {
    const [players, tokens] = await Promise.all([
      prisma.obrPlayerCharacterBinding.findMany({
        where: { obrRoomId: roomId },
        orderBy: { obrPlayerId: 'asc' },
        select: playerBindingSelect,
      }),
      prisma.obrTokenCharacterBinding.findMany({
        where: { obrRoomId: roomId },
        orderBy: { obrTokenId: 'asc' },
        select: tokenBindingSelect,
      }),
    ]);
    return { players: players.map(toPlayerRow), tokens: tokens.map(toTokenRow) };
  },

  async getPlayerBinding(roomId, playerId) {
    const row = await prisma.obrPlayerCharacterBinding.findUnique({
      where: { obrRoomId_obrPlayerId: { obrRoomId: roomId, obrPlayerId: playerId } },
      select: playerBindingSelect,
    });
    return row ? toPlayerRow(row) : null;
  },

  async setPlayerBinding(input) {
    return prisma.$transaction(async (tx) => {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: input.roomId },
        create: { obrRoomId: input.roomId },
        update: { updatedAt: new Date() },
      });
      const row = await tx.obrPlayerCharacterBinding.upsert({
        where: { obrRoomId_obrPlayerId: { obrRoomId: input.roomId, obrPlayerId: input.playerId } },
        create: {
          obrRoomId: input.roomId,
          obrPlayerId: input.playerId,
          obrConnectionId: input.connectionId,
          characterId: input.characterId,
          assignedByPlayerId: input.assignedByPlayerId,
        },
        update: {
          obrConnectionId: input.connectionId,
          characterId: input.characterId,
          assignedByPlayerId: input.assignedByPlayerId,
        },
        select: playerBindingSelect,
      });
      return toPlayerRow(row);
    });
  },

  async clearPlayerBinding(roomId, playerId) {
    await prisma.obrPlayerCharacterBinding.deleteMany({ where: { obrRoomId: roomId, obrPlayerId: playerId } });
  },

  async getTokenBinding(roomId, tokenId) {
    const row = await prisma.obrTokenCharacterBinding.findUnique({
      where: { obrRoomId_obrTokenId: { obrRoomId: roomId, obrTokenId: tokenId } },
      select: tokenBindingSelect,
    });
    return row ? toTokenRow(row) : null;
  },

  async setTokenBinding(input) {
    return prisma.$transaction(async (tx) => {
      await tx.obrRoomBinding.upsert({
        where: { obrRoomId: input.roomId },
        create: { obrRoomId: input.roomId },
        update: { updatedAt: new Date() },
      });
      const row = await tx.obrTokenCharacterBinding.upsert({
        where: { obrRoomId_obrTokenId: { obrRoomId: input.roomId, obrTokenId: input.tokenId } },
        create: {
          obrRoomId: input.roomId,
          obrTokenId: input.tokenId,
          assignedPlayerId: input.playerId,
          characterId: input.characterId,
        },
        update: { assignedPlayerId: input.playerId, characterId: input.characterId },
        select: tokenBindingSelect,
      });
      return toTokenRow(row);
    });
  },

  async clearTokenBinding(roomId, tokenId) {
    await prisma.obrTokenCharacterBinding.deleteMany({ where: { obrRoomId: roomId, obrTokenId: tokenId } });
  },

  async filterCharacterIdsInRoom(ids, roomId) {
    if (ids.length === 0) return [];
    const [players, tokens] = await Promise.all([
      prisma.obrPlayerCharacterBinding.findMany({
        where: { obrRoomId: roomId, characterId: { in: ids } },
        select: { characterId: true },
      }),
      prisma.obrTokenCharacterBinding.findMany({
        where: { obrRoomId: roomId, characterId: { in: ids } },
        select: { characterId: true },
      }),
    ]);
    const bound = new Set([...players.map((r) => r.characterId), ...tokens.map((r) => r.characterId)]);
    return ids.filter((id) => bound.has(id));
  },
};
