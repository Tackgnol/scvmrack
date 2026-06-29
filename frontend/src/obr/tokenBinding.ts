import OBR, { buildLabel, type Item } from "@owlbear-rodeo/sdk";
import {
  CHARACTER_META_KEY,
  TOKEN_MARKER_CHARACTER_META_KEY,
  TOKEN_MARKER_META_KEY,
} from "./extension";
import { broadcastRosterChanged } from "./roster";

export type SelectionBindingState = {
  selectedIds: string[];
  selectedCount: number;
  hasSelection: boolean;
  hasBoundToken: boolean;
  boundCharacterIds: string[];
};

const EMPTY_SELECTION_STATE: SelectionBindingState = {
  selectedIds: [],
  selectedCount: 0,
  hasSelection: false,
  hasBoundToken: false,
  boundCharacterIds: [],
};

const MARKER_OFFSET_Y = 18;

// Bind a scvmrack character to the player's currently-selected token(s): stamp
// the character id into the token's namespaced metadata and rename the token so
// it reads as that scvm on the map. It also adds a small attached label marker
// so the map visibly distinguishes scvmrack-bound tokens. One-way (scvmrack ->
// token); the metadata is the source of truth the context menu and roster use.
// Returns the number of tokens bound (0 = nothing selected).
export async function bindCharacterToSelection(
  characterId: string,
  characterName: string,
): Promise<number> {
  const selection = await OBR.player.getSelection();
  if (!selection || selection.length === 0) {
    return 0;
  }

  await OBR.scene.items.updateItems(selection, (items) => {
    for (const item of items) {
      item.metadata[CHARACTER_META_KEY] = characterId;
      item.name = characterName;
    }
  });

  try {
    await syncBoundTokenMarkers(selection, characterId, characterName);
  } catch {
    // Token metadata is the durable source of truth; the marker is a visual aid.
  }

  try {
    await broadcastRosterChanged();
  } catch {
    // Scene metadata still carries the roster source of truth.
  }

  return selection.length;
}

export async function getSelectedTokenBindingState(
  selectedIds?: string[],
): Promise<SelectionBindingState> {
  const selection = selectedIds ?? (await OBR.player.getSelection()) ?? [];
  if (selection.length === 0) {
    return EMPTY_SELECTION_STATE;
  }

  const items = await OBR.scene.items.getItems(selection);
  const boundCharacterIds = [
    ...new Set(
      items
        .map((item) => item.metadata[CHARACTER_META_KEY])
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    ),
  ];

  return {
    selectedIds: selection,
    selectedCount: selection.length,
    hasSelection: true,
    hasBoundToken: boundCharacterIds.length > 0,
    boundCharacterIds,
  };
}

export async function syncBoundTokenMarkers(
  tokenIds: string[],
  characterId: string,
  characterName: string,
): Promise<void> {
  if (tokenIds.length === 0) return;

  const attachments = await OBR.scene.items.getItemAttachments(tokenIds);
  const oldMarkerIds = attachments
    .filter(isScvmrackTokenMarker)
    .map((item) => item.id);

  if (oldMarkerIds.length > 0) {
    await OBR.scene.items.deleteItems(oldMarkerIds);
  }

  const markers = await Promise.all(
    tokenIds.map((tokenId) => buildBoundTokenMarker(tokenId, characterId, characterName)),
  );
  await OBR.scene.items.addItems(markers);
}

function isScvmrackTokenMarker(item: Item): boolean {
  return item.metadata[TOKEN_MARKER_META_KEY] === true;
}

async function buildBoundTokenMarker(
  tokenId: string,
  characterId: string,
  characterName: string,
): Promise<Item> {
  const bounds = await OBR.scene.items.getItemBounds([tokenId]);
  const label = characterName.trim() || "Scvm";

  return buildLabel()
    .name(`Scvmrack binding: ${label}`)
    .plainText(label)
    .width("AUTO")
    .height("AUTO")
    .padding(4)
    .fontFamily("Antonio")
    .fontSize(13)
    .fontWeight(700)
    .textAlign("CENTER")
    .textAlignVertical("MIDDLE")
    .fillColor("#FFE900")
    .fillOpacity(1)
    .strokeColor("#090909")
    .strokeOpacity(1)
    .strokeWidth(1)
    .backgroundColor("#090909")
    .backgroundOpacity(0.92)
    .cornerRadius(3)
    .pointerWidth(8)
    .pointerHeight(7)
    .pointerDirection("DOWN")
    .position({
      x: bounds.center.x,
      y: bounds.min.y - MARKER_OFFSET_Y,
    })
    .attachedTo(tokenId)
    .layer("ATTACHMENT")
    .locked(true)
    .disableHit(true)
    .disableAutoZIndex(true)
    .disableAttachmentBehavior(["SCALE", "ROTATION", "COPY"])
    .metadata({
      [TOKEN_MARKER_META_KEY]: true,
      [TOKEN_MARKER_CHARACTER_META_KEY]: characterId,
    })
    .build();
}
