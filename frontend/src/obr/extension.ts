import { createObrExtension } from "@tackgnol/rpgtools-owlbear";

// Shared identity for Owlbear Rodeo integration. Namespaces all metadata keys so
// they never collide with other extensions on the same scene items. This is the
// only scvmrack OBR file that changes shape when the rpgtools-owlbear package
// changes — every other file keeps importing these same names from here.
export const scvmrackObrExtension = createObrExtension("co.rpgtools.scvmrack");

export const {
  EXTENSION_ID,
  CHARACTER_META_KEY,
  PLAYER_CHARACTER_META_KEY,
  PLAYER_NAME_META_KEY,
  TOKEN_MARKER_META_KEY,
  TOKEN_MARKER_CHARACTER_META_KEY,
} = scvmrackObrExtension;
