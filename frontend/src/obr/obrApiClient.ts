import type { ObrApiClient } from "@tackgnol/rpgtools-owlbear/client";
import type { ObrRoomBindingsClient } from "@tackgnol/rpgtools-owlbear";
import {
  bindObrPlayerCharacter,
  bindObrTokenCharacter,
  claimAssignedObrCharacter,
  clearObrPlayerCharacter,
  clearObrTokenCharacter,
  fetchObrCards,
  fetchObrRoomBindings,
  type ObrLocale,
} from "@/api/obr";

// roomBinding.ts's core functions (restoreCurrentObrCharacterId,
// persistCurrentObrCharacterId, bindCurrentCharacterToSelection, ...) take a
// narrow ObrRoomBindingsClient port so that module has no HTTP dependency.
// Package react-query hooks need the wider ObrApiClient shape. Both adapters
// delegate to frontend/src/api/obr.ts, keeping CSRF/auth in the normal app
// OpenAPI client instead of a second raw-fetch path.
export const obrApiClient = {
  fetchCards: (ids, roomId, locale) =>
    fetchObrCards(ids, roomId, locale as ObrLocale),
  fetchRoomBindings: fetchObrRoomBindings,
  bindPlayerCharacter: bindObrPlayerCharacter,
  clearPlayerCharacter: clearObrPlayerCharacter,
  bindTokenCharacter: bindObrTokenCharacter,
  clearTokenCharacter: clearObrTokenCharacter,
} satisfies ObrApiClient;

export const obrRoomBindingsClient: ObrRoomBindingsClient = {
  fetchRoomBindings: fetchObrRoomBindings,
  bindPlayerCharacter: bindObrPlayerCharacter,
  clearPlayerCharacter: clearObrPlayerCharacter,
  bindTokenCharacter: bindObrTokenCharacter,
  clearTokenCharacter: clearObrTokenCharacter,
};

export { claimAssignedObrCharacter };
