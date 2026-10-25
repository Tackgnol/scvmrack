import type { ObrApiClient } from "@tackgnol/rpgtools-owlbear/client";
import type { ObrRoomBindingsClient } from "@tackgnol/rpgtools-owlbear";
import OBR from "@owlbear-rodeo/sdk";
import { BINDING_GENERATION_META_KEY } from "./extension";
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

async function bindToken(input: Parameters<typeof bindObrTokenCharacter>[0]) {
  const binding = await bindObrTokenCharacter(input);
  await OBR.scene.items.updateItems([input.tokenId], (items) => {
    for (const item of items) {
      item.metadata[BINDING_GENERATION_META_KEY] = binding.generation;
    }
  });
  return binding;
}

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
  bindTokenCharacter: bindToken,
  clearTokenCharacter: clearObrTokenCharacter,
} satisfies ObrApiClient;

export const obrRoomBindingsClient: ObrRoomBindingsClient = {
  fetchRoomBindings: fetchObrRoomBindings,
  bindPlayerCharacter: bindObrPlayerCharacter,
  clearPlayerCharacter: clearObrPlayerCharacter,
  bindTokenCharacter: bindToken,
  clearTokenCharacter: clearObrTokenCharacter,
};

export { claimAssignedObrCharacter };
