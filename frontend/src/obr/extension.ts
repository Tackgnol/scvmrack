// Shared identity for Owlbear Rodeo integration. Namespaces all metadata keys so
// they never collide with other extensions on the same scene items.
export const EXTENSION_ID = 'co.rpgtools.scvmrack';

// Key under which a scene item (token) stores the bound scvmrack character id.
export const CHARACTER_META_KEY = `${EXTENSION_ID}/characterId`;

// Keys for the small attached label that marks an OBR token as scvmrack-bound.
// The marker deliberately does NOT use CHARACTER_META_KEY; roster/context-menu
// scans should read the real token, not its decorative attachment.
export const TOKEN_MARKER_META_KEY = `${EXTENSION_ID}/tokenMarker`;
export const TOKEN_MARKER_CHARACTER_META_KEY = `${EXTENSION_ID}/tokenMarkerCharacterId`;
