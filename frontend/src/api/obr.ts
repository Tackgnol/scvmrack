import { client } from "@/api";
import { unwrapApiResult, type ApiResult } from "@/api/clientResult";
import type {
  PathsApiObrRoomsRoomIdCardsGetParametersQueryLocale,
  paths,
} from "@/api/schema";

type CardsResponse =
  paths["/api/obr/rooms/{roomId}/cards"]["get"]["responses"][200]["content"]["application/json"];
export type ObrLocale = PathsApiObrRoomsRoomIdCardsGetParametersQueryLocale;
export type ObrCard = CardsResponse[number];

type BindingsResponse =
  paths["/api/obr/rooms/{roomId}/bindings"]["get"]["responses"][200]["content"]["application/json"];
export type ObrPlayerCharacterBinding = BindingsResponse["players"][number];
export type ObrTokenCharacterBinding = BindingsResponse["tokens"][number];
export type ObrRoomBindings = BindingsResponse;
type CharacterResponse =
  paths["/api/characters/{id}"]["get"]["responses"][200]["content"]["application/json"];
type ClaimAssignedObrCharacterRequest = {
  params: {
    path: { roomId: string; playerId: string };
    query: { locale: string };
  };
};
const postClaimAssignedObrCharacter = client.POST as unknown as (
  path: "/api/obr/rooms/{roomId}/players/{playerId}/character/claim",
  options: ClaimAssignedObrCharacterRequest,
) => Promise<ApiResult<CharacterResponse>>;

export const obrKeys = {
  bindings: (roomId: string) => ["obr", "rooms", roomId, "bindings"] as const,
  cards: (
    roomId: string,
    ids: string[],
    locale?: ObrLocale,
  ) => ["obr", "cards", roomId, ids, locale] as const,
};

// Compact cards for the OBR roster/peek. Gated by the (roomId, id) pair: both
// must be presented and match a durable OBR room binding (see backend
// obr-room-binding-service.getCards).
export async function fetchObrCards(
  ids: string[],
  roomId: string,
  locale: ObrLocale,
): Promise<ObrCard[]> {
  return unwrapApiResult(
    (await client.GET("/api/obr/rooms/{roomId}/cards", {
      params: { path: { roomId }, query: { ids: ids.join(","), locale } },
    })) as ApiResult<ObrCard[]>,
    "Failed to load scvm cards",
  );
}

export async function fetchObrRoomBindings(
  roomId: string,
): Promise<ObrRoomBindings> {
  return unwrapApiResult(
    (await client.GET("/api/obr/rooms/{roomId}/bindings", {
      params: { path: { roomId } },
    })) as ApiResult<ObrRoomBindings>,
    "Failed to load Owlbear room bindings",
  );
}

export async function bindObrPlayerCharacter(input: {
  roomId: string;
  playerId: string;
  characterId: string;
  connectionId?: string | null;
}): Promise<ObrPlayerCharacterBinding> {
  return unwrapApiResult(
    (await client.PUT(
      "/api/obr/rooms/{roomId}/players/{playerId}/character",
      {
        params: {
          path: { roomId: input.roomId, playerId: input.playerId },
        },
        body: {
          characterId: input.characterId,
          connectionId: input.connectionId ?? undefined,
        },
      },
    )) as ApiResult<ObrPlayerCharacterBinding>,
    "Failed to bind Owlbear player to scvm",
  );
}

export async function clearObrPlayerCharacter(input: {
  roomId: string;
  playerId: string;
}): Promise<void> {
  await unwrapApiResult(
    (await client.DELETE(
      "/api/obr/rooms/{roomId}/players/{playerId}/character",
      {
        params: {
          path: { roomId: input.roomId, playerId: input.playerId },
        },
      },
    )) as ApiResult<void>,
    "Failed to clear Owlbear player binding",
  );
}

export async function bindObrTokenCharacter(input: {
  roomId: string;
  tokenId: string;
  characterId: string;
  playerId?: string | null;
}): Promise<ObrTokenCharacterBinding> {
  return unwrapApiResult(
    (await client.PUT(
      "/api/obr/rooms/{roomId}/tokens/{tokenId}/character",
      {
        params: {
          path: { roomId: input.roomId, tokenId: input.tokenId },
        },
        body: {
          characterId: input.characterId,
          playerId: input.playerId ?? undefined,
        },
      },
    )) as ApiResult<ObrTokenCharacterBinding>,
    "Failed to bind Owlbear token to scvm",
  );
}

export async function clearObrTokenCharacter(input: {
  roomId: string;
  tokenId: string;
}): Promise<void> {
  await unwrapApiResult(
    (await client.DELETE(
      "/api/obr/rooms/{roomId}/tokens/{tokenId}/character",
      {
        params: {
          path: { roomId: input.roomId, tokenId: input.tokenId },
        },
      },
    )) as ApiResult<void>,
    "Failed to clear Owlbear token binding",
  );
}

export async function claimAssignedObrCharacter(input: {
  roomId: string;
  playerId: string;
  locale: string;
}): Promise<CharacterResponse> {
  return unwrapApiResult(
    await postClaimAssignedObrCharacter(
      "/api/obr/rooms/{roomId}/players/{playerId}/character/claim",
      {
        params: {
          path: { roomId: input.roomId, playerId: input.playerId },
          query: { locale: input.locale },
        },
      },
    ),
    "Failed to claim assigned Owlbear scvm",
  );
}
