import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { paths } from "@/api/schema";
import type { ApiLocale } from "@/api";

// shortcut: @tackgnol/rpgtools-owlbear registers the room-binding routes without
// response schemas, so the generated client can't type them; drop these once it ships schemas.
export type ObrLocale = ApiLocale;
export type ObrCard = {
  id?: string | null;
  name?: string;
  className?: string | null;
  currentHp?: number;
  maxHp?: number;
  strength?: number;
  agility?: number;
  presence?: number;
  toughness?: number;
  drToDodge?: number;
  drToMelee?: number;
  drToRanged?: number;
  omens?: number;
  maxOmens?: number;
  silver?: number;
  equippedWeapons?: { name?: string | null; dice?: number[] }[];
  equippedArmor?: {
    name?: string | null;
    dice?: number[];
    maxTier?: number;
    currentTier?: number;
  };
  equipment?: { name?: string; description?: string }[];
  computedModifiers?: Record<string, unknown>[];
  bodyDescription?: string | null;
  habit?: string | null;
  origin?: string | null;
  trait1?: string | null;
  trait2?: string | null;
};
export type ObrPlayerCharacterBinding = {
  playerId: string;
  connectionId: string | null;
  characterId: string;
  assignedByPlayerId: string;
};
export type ObrTokenCharacterBinding = {
  tokenId: string;
  generation?: string;
  playerId: string | null;
  characterId: string;
};
export type ObrRoomBindings = {
  roomId: string;
  players: ObrPlayerCharacterBinding[];
  tokens: ObrTokenCharacterBinding[];
};
type CharacterResponse =
  paths["/api/characters/{id}"]["get"]["responses"][200]["content"]["application/json"];

const obrClient = client as unknown as UntypedApiClient;

export { obrKeys } from "./obrKeys";

// Compact cards for the OBR roster/peek. Gated by the (roomId, id) pair: both
// must be presented and match a durable OBR room binding (see backend
// obr-room-binding-service.getCards).
export async function fetchObrCards(
  ids: string[],
  roomId: string,
  locale: ObrLocale,
): Promise<ObrCard[]> {
  return unwrapApiResult(
    await obrClient.GET("/api/obr/rooms/{roomId}/cards", {
      params: { path: { roomId }, query: { ids: ids.join(","), locale } },
    }),
    "Failed to load scvm cards",
  );
}

export async function fetchObrRoomBindings(
  roomId: string,
): Promise<ObrRoomBindings> {
  return unwrapApiResult(
    await obrClient.GET("/api/obr/rooms/{roomId}/bindings", {
      params: { path: { roomId } },
    }),
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
    await obrClient.PUT(
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
    ),
    "Failed to bind Owlbear player to scvm",
  );
}

export async function clearObrPlayerCharacter(input: {
  roomId: string;
  playerId: string;
}): Promise<void> {
  await unwrapApiResult(
    await obrClient.DELETE(
      "/api/obr/rooms/{roomId}/players/{playerId}/character",
      {
        params: {
          path: { roomId: input.roomId, playerId: input.playerId },
        },
      },
    ),
    "Failed to clear Owlbear player binding",
  );
}

export async function bindObrTokenCharacter(input: {
  roomId: string;
  tokenId: string;
  characterId: string;
  playerId?: string | null;
}): Promise<ObrTokenCharacterBinding & { generation: string }> {
  return unwrapApiResult(
    await obrClient.PUT("/api/obr/rooms/{roomId}/tokens/{tokenId}/character", {
      params: {
        path: { roomId: input.roomId, tokenId: input.tokenId },
      },
      body: {
        characterId: input.characterId,
        playerId: input.playerId ?? undefined,
      },
    }),
    "Failed to bind Owlbear token to scvm",
  );
}

export async function clearObrTokenCharacter(input: {
  roomId: string;
  tokenId: string;
}): Promise<void> {
  await unwrapApiResult(
    await obrClient.DELETE(
      "/api/obr/rooms/{roomId}/tokens/{tokenId}/character",
      {
        params: {
          path: { roomId: input.roomId, tokenId: input.tokenId },
        },
      },
    ),
    "Failed to clear Owlbear token binding",
  );
}

export async function claimAssignedObrCharacter(input: {
  roomId: string;
  playerId: string;
  locale: ObrLocale;
}): Promise<CharacterResponse> {
  return unwrapApiResult(
    await client.POST(
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
