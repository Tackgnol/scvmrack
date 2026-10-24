import {
  broadcastRosterChanged,
  unbindCharacterFromToken,
  unbindRoomPlayerCharacter,
} from "@tackgnol/rpgtools-owlbear";
import OBR from "@owlbear-rodeo/sdk";
import { scvmrackObrExtension } from "./extension";
import { obrRoomBindingsClient } from "./obrApiClient";
import type { ObrPartyRosterBindingRow } from "./useObrRosterCards.models";

async function clearPlayerBinding(roomId: string, playerId: string) {
  await unbindRoomPlayerCharacter(
    scvmrackObrExtension,
    OBR,
    obrRoomBindingsClient,
    { roomId, playerId },
  );
}

async function clearTokenBinding(roomId: string, tokenId: string) {
  // Keep the durable binding discoverable until scene cleanup succeeds.
  await unbindCharacterFromToken(scvmrackObrExtension, OBR, tokenId);
  await obrRoomBindingsClient.clearTokenCharacter({ roomId, tokenId });
  await broadcastRosterChanged(scvmrackObrExtension, OBR);
}

/** Attempt every binding cleanup and reject only after all attempts settle. */
export async function clearRosterBindings(
  roomId: string,
  row: ObrPartyRosterBindingRow | undefined,
): Promise<void> {
  if (!row) {
    return;
  }
  const results = await Promise.allSettled([
    ...row.players.map(({ playerId }) => clearPlayerBinding(roomId, playerId)),
    ...row.tokens.map(({ tokenId }) => clearTokenBinding(roomId, tokenId)),
  ]);
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    throw failed.reason;
  }
}
