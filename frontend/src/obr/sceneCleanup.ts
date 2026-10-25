import OBR from "@owlbear-rodeo/sdk";
import { broadcastRosterChanged } from "@tackgnol/rpgtools-owlbear";
import {
  acknowledgeSceneCleanup,
  type RoomParticipation,
} from "@/api/roomParticipation";
import { scvmrackObrExtension, BINDING_GENERATION_META_KEY } from "./extension";

/** Clear only the captured generation. Missing tokens remain pending until their scene is open. */
export async function finishSceneCleanup(
  roomId: string,
  snapshot: RoomParticipation,
): Promise<boolean> {
  if (!snapshot.canManage || snapshot.cleanup.length === 0) {
    return snapshot.cleanup.length === 0;
  }
  if (!(await OBR.scene.isReady().catch(() => false))) {
    return false;
  }
  let complete = true;
  for (const cleanup of snapshot.cleanup) {
    try {
      const items = await OBR.scene.items.getItems([cleanup.tokenId]);
      if (items.length === 0) {
        complete = false;
        continue;
      }
      await OBR.scene.items.updateItems([cleanup.tokenId], (items) => {
        for (const item of items) {
          const generation = item.metadata[BINDING_GENERATION_META_KEY];
          if (
            item.metadata[scvmrackObrExtension.CHARACTER_META_KEY] ===
              cleanup.characterId &&
            (generation === cleanup.generation || generation === undefined)
          ) {
            delete item.metadata[scvmrackObrExtension.CHARACTER_META_KEY];
            delete item.metadata[BINDING_GENERATION_META_KEY];
          }
        }
      });
      await acknowledgeSceneCleanup(roomId, cleanup.id);
    } catch {
      complete = false;
    }
  }
  await broadcastRosterChanged(scvmrackObrExtension, OBR).catch(
    () => undefined,
  );
  return complete;
}
