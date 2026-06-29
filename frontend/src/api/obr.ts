import { client } from "@/api";
import { unwrapApiResult, type ApiResult } from "@/api/clientResult";
import type {
  PathsApiCharactersCardsGetParametersQueryLocale,
  paths,
} from "@/api/schema";

type CardsResponse =
  paths["/api/characters/cards"]["get"]["responses"][200]["content"]["application/json"];
export type ObrCard = CardsResponse[number];

// Compact cards for the OBR roster/peek. Gated by the (roomId, id) pair: both
// must be presented and match the binding the owner recorded (see backend
// character-service.getCards).
export async function fetchObrCards(
  ids: string[],
  roomId: string,
  locale: PathsApiCharactersCardsGetParametersQueryLocale,
): Promise<ObrCard[]> {
  return unwrapApiResult(
    (await client.GET("/api/characters/cards", {
      params: { query: { ids: ids.join(","), roomId, locale } },
    })) as ApiResult<ObrCard[]>,
    "Failed to load scvm cards",
  );
}

// Record which Owlbear room this scvm is bound to so the GM (and the peek
// popover) can read its card in that room. Owner-gated on the backend.
export async function bindObrRoom(
  characterId: string,
  roomId: string,
): Promise<void> {
  await unwrapApiResult(
    (await client.POST("/api/characters/{id}/obr-room", {
      params: { path: { id: characterId } },
      body: { roomId },
    })) as ApiResult<void>,
    "Failed to register scvm with the room",
  );
}
