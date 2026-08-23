import type { IncomingHttpHeaders } from 'node:http';
import { obrBindingsDb } from './obr-bindings-db.js';

const MAX_OBR_HEADER_LENGTH = 256;

export type ObrCharacterAccessContext = {
  roomId: string;
  playerId: string;
  connectionId?: string | null;
};

export function readObrCharacterAccessHeaders(
  headers: IncomingHttpHeaders
): ObrCharacterAccessContext | null {
  const roomId = readHeader(headers['x-obr-room-id']);
  const playerId = readHeader(headers['x-obr-player-id']);
  if (!roomId || !playerId) {
    return null;
  }

  return {
    roomId,
    playerId,
    connectionId: readHeader(headers['x-obr-connection-id']),
  };
}

export async function hasObrPlayerCharacterAccess(
  characterId: string,
  context: ObrCharacterAccessContext | null | undefined
): Promise<boolean> {
  if (!context) {
    return false;
  }

  const binding = await obrBindingsDb.getPlayerBinding(
    context.roomId,
    context.playerId
  );

  return binding?.characterId === characterId;
}

function readHeader(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_OBR_HEADER_LENGTH
  ) {
    return null;
  }

  return trimmed;
}
