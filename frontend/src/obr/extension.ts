import {
  broadcastCharacterCardChanged,
  broadcastRosterChanged,
  createObrExtension,
  getCurrentObrRoomActor,
  isObrRosterBroadcast,
  persistCurrentObrCharacterId,
  restoreCurrentObrCharacterId,
  rosterChannel,
  unbindCharacterFromToken,
} from "@tackgnol/rpgtools-owlbear";

// Shared identity for Owlbear Rodeo integration. Namespaces all metadata keys so
// they never collide with other extensions on the same scene items. Only
// src/obr/ imports @tackgnol/rpgtools-owlbear; modules written since the
// adapter split take the package's helpers from the re-exports below, so a
// package change touches this file and the older src/obr importers only.
export const scvmrackObrExtension = createObrExtension("co.rpgtools.scvmrack");

export const BINDING_GENERATION_META_KEY = `${scvmrackObrExtension.EXTENSION_ID}/binding-generation`;

export const {
  EXTENSION_ID,
  CHARACTER_META_KEY,
  PLAYER_CHARACTER_META_KEY,
  TOKEN_MARKER_META_KEY,
} = scvmrackObrExtension;

export {
  broadcastCharacterCardChanged,
  broadcastRosterChanged,
  getCurrentObrRoomActor,
  isObrRosterBroadcast,
  persistCurrentObrCharacterId,
  restoreCurrentObrCharacterId,
  rosterChannel,
  unbindCharacterFromToken,
};
