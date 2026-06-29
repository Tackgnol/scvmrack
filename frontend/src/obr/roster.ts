import OBR from "@owlbear-rodeo/sdk";
import { CHARACTER_META_KEY, EXTENSION_ID } from "./extension";

export const OBR_ROSTER_CHANNEL = `${EXTENSION_ID}/roster`;

export type ObrRosterBroadcast =
  | { kind: "roster" }
  | { kind: "card"; characterId: string };

export async function getBoundCharacterIds(): Promise<string[]> {
  if (!(await OBR.scene.isReady())) {
    return [];
  }

  const items = await OBR.scene.items.getItems();
  const ids = new Set<string>();

  for (const item of items) {
    const id = item.metadata[CHARACTER_META_KEY];
    if (typeof id === "string" && id) {
      ids.add(id);
    }
  }

  return [...ids];
}

export function isObrRosterBroadcast(
  data: unknown,
): data is ObrRosterBroadcast {
  if (!data || typeof data !== "object") {
    return false;
  }

  const message = data as Record<string, unknown>;
  if (message.kind === "roster") {
    return true;
  }

  return message.kind === "card" && typeof message.characterId === "string";
}

export async function broadcastRosterChanged(): Promise<void> {
  await OBR.broadcast.sendMessage(
    OBR_ROSTER_CHANNEL,
    { kind: "roster" } satisfies ObrRosterBroadcast,
    { destination: "ALL" },
  );
}

export async function broadcastCharacterCardChanged(
  characterId: string,
): Promise<void> {
  await OBR.broadcast.sendMessage(
    OBR_ROSTER_CHANNEL,
    { kind: "card", characterId } satisfies ObrRosterBroadcast,
    { destination: "ALL" },
  );
}
