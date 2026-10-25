import {
  bindCharacterToTokens,
  unbindCharacterFromToken,
} from "@tackgnol/rpgtools-owlbear";
import { obrApiClient } from "./obrApiClient";
import { scvmrackObrExtension } from "./extension";
import OBR from "@owlbear-rodeo/sdk";
import { fetchRoomParticipation } from "@/api/roomParticipation";
import { BINDING_GENERATION_META_KEY, CHARACTER_META_KEY } from "./extension";

/** Repair external metadata after an SDK round trip; the database remains authoritative. */
export async function reconcileRoomTokens(
  roomId: string,
  tokenIds: string[],
): Promise<void> {
  if (tokenIds.length === 0) {
    return;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await fetchRoomParticipation(roomId);
    const desired = new Map(
      before.tokens.map((binding) => [binding.tokenId, binding]),
    );
    const items = await OBR.scene.items.getItems(tokenIds);
    if (items.length !== tokenIds.length) {
      throw new Error("Token scene unavailable; retry scene synchronization.");
    }
    await OBR.scene.items.updateItems(tokenIds, (drafts) => {
      for (const item of drafts) {
        const binding = desired.get(item.id);
        if (binding) {
          item.metadata[CHARACTER_META_KEY] = binding.characterId;
          item.metadata[BINDING_GENERATION_META_KEY] = binding.generation;
        } else {
          delete item.metadata[CHARACTER_META_KEY];
          delete item.metadata[BINDING_GENERATION_META_KEY];
        }
      }
    });
    const after = await fetchRoomParticipation(roomId);
    const current = new Map(
      after.tokens.map((binding) => [binding.tokenId, binding]),
    );
    if (
      tokenIds.every(
        (id) => desired.get(id)?.generation === current.get(id)?.generation,
      )
    ) {
      return;
    }
  }
  throw new Error("Room bindings changed during scene synchronization; retry.");
}

/** Capture selection once so persistence, SDK writes and final repair use the same tokens. */
export async function bindRoomSelectedTokens(input: {
  roomId: string;
  characterId: string;
  characterName: string;
  playerId?: string | null;
}) {
  const tokenIds = (await OBR.player.getSelection()) ?? [];
  try {
    for (const tokenId of tokenIds) {
      await obrApiClient.bindTokenCharacter({
        roomId: input.roomId,
        tokenId,
        characterId: input.characterId,
        playerId: input.playerId,
      });
    }
    const count = await bindCharacterToTokens(
      scvmrackObrExtension,
      OBR,
      tokenIds,
      input.characterId,
      input.characterName,
    );
    return { count, metadataSynced: true };
  } finally {
    await reconcileRoomTokens(input.roomId, tokenIds);
  }
}

export async function unbindRoomToken(
  roomId: string,
  tokenId: string,
): Promise<void> {
  try {
    await obrApiClient.clearTokenCharacter({ roomId, tokenId });
    await unbindCharacterFromToken(scvmrackObrExtension, OBR, tokenId);
  } finally {
    await reconcileRoomTokens(roomId, [tokenId]);
  }
}
