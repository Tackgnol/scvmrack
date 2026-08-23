export type ObrCharacterAccessContext = {
  roomId: string;
  playerId: string;
  connectionId?: string | null;
};

let currentObrCharacterAccess: ObrCharacterAccessContext | null = null;

export function setObrCharacterAccessContext(
  context: ObrCharacterAccessContext
): void {
  currentObrCharacterAccess = {
    roomId: context.roomId,
    playerId: context.playerId,
    connectionId: context.connectionId ?? null,
  };
}

export function clearObrCharacterAccessContext(): void {
  currentObrCharacterAccess = null;
}

export function obrCharacterAccessHeaders(): Record<string, string> {
  if (!currentObrCharacterAccess) {
    return {};
  }

  const headers: Record<string, string> = {
    "x-obr-room-id": currentObrCharacterAccess.roomId,
    "x-obr-player-id": currentObrCharacterAccess.playerId,
  };

  if (currentObrCharacterAccess.connectionId) {
    headers["x-obr-connection-id"] = currentObrCharacterAccess.connectionId;
  }

  return headers;
}
