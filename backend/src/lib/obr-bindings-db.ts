import type { ObrBindingsDb } from '@tackgnol/rpgtools-owlbear/server';
import prisma from './prisma.js';

const playerBindingSelect = {
  obrRoomId: true,
  obrPlayerId: true,
  obrConnectionId: true,
  characterId: true,
  assignedByPlayerId: true,
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

export const obrBindingsDb: Pick<
  ObrBindingsDb,
  'getPlayerBinding' | 'filterCharacterIdsInRoom'
> = {
  async getPlayerBinding(roomId, playerId) {
    const row = await prisma.obrPlayerCharacterBinding.findUnique({
      where: { obrRoomId_obrPlayerId: { obrRoomId: roomId, obrPlayerId: playerId },
      },
      select: playerBindingSelect,
    });
    return row ? toPlayerRow(row) : null;
  },

  async filterCharacterIdsInRoom(ids, roomId) {
    if (ids.length === 0) {
      return [];
    }
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
    const bound = new Set([...players.map((r) => r.characterId), ...tokens.map((r) => r.characterId),
    ]);
    return ids.filter((id) => bound.has(id));
  },
};
