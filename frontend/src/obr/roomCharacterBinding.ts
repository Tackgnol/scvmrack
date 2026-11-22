import OBR from "@owlbear-rodeo/sdk";
import type { QueryClient } from "@tanstack/react-query";
import { fetchCurrentRoomParticipation } from "@/api/roomParticipationQueries";
import {
  broadcastCharacterCardChanged,
  getCurrentObrRoomActor,
  isObrRosterBroadcast,
  PLAYER_CHARACTER_META_KEY,
  persistCurrentObrCharacterId,
  restoreCurrentObrCharacterId,
  rosterChannel,
  scvmrackObrExtension,
} from "./extension";
import { obrRoomBindingsClient } from "./obrApiClient";
import type { Owlbear, Unsubscribe } from "./owlbear.models";

export type ObrRoomActor = Awaited<ReturnType<typeof getCurrentObrRoomActor>>;

export const ROSTER_CHANNEL = rosterChannel(scvmrackObrExtension);

/** The room and the Owlbear player acting in it. */
export function currentRoomActor() {
  return getCurrentObrRoomActor(OBR);
}

/** The scvm this player has bound in the current room, if any. */
export function restorePlayerCharacterId() {
  return restoreCurrentObrCharacterId(
    scvmrackObrExtension,
    OBR,
    obrRoomBindingsClient,
  );
}

/** Binds a scvm to this player in the current room. */
export function rememberPlayerCharacterId(characterId: string) {
  return persistCurrentObrCharacterId(
    scvmrackObrExtension,
    OBR,
    obrRoomBindingsClient,
    characterId,
  );
}

/** Whether the current room still holds this scvm, as a party member or through a binding. */
export async function isCharacterInCurrentRoom(
  queryClient: QueryClient,
  characterId: string,
): Promise<boolean> {
  const actor = await currentRoomActor();
  const room = await fetchCurrentRoomParticipation(queryClient, actor.roomId);
  return (
    room.memberIds.includes(characterId) ||
    [...room.players, ...room.tokens].some(
      (binding) => binding.characterId === characterId,
    )
  );
}

/** Drops this player's remembered scvm from their Owlbear metadata. */
export function forgetPlayerCharacterId() {
  return OBR.player.setMetadata({ [PLAYER_CHARACTER_META_KEY]: undefined });
}

/** Tells the room a scvm's card changed so open cards refetch. */
export function announceCharacterCardChanged(characterId: string) {
  return broadcastCharacterCardChanged(scvmrackObrExtension, OBR, characterId);
}

/** Calls `listener` whenever the room broadcasts a roster change. */
export function onRosterChanged(
  owlbear: Owlbear,
  listener: () => void,
): Unsubscribe {
  return owlbear.onBroadcast(ROSTER_CHANNEL, (data) => {
    if (isRosterChange(data)) {
      listener();
    }
  });
}

function isRosterChange(data: unknown): boolean {
  return (
    isObrRosterBroadcast(data) &&
    (data as { kind?: unknown } | null)?.kind === "roster"
  );
}
