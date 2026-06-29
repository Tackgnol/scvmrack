import OBR, {
  type ContextMenuContext,
  type ContextMenuItem,
} from "@owlbear-rodeo/sdk";
import { ENEMY_META_KEY, getContextEnemyId } from "./enemies";
import { CHARACTER_META_KEY, EXTENSION_ID } from "./extension";

export const VIEW_SCVM_CONTEXT_MENU_ID = `${EXTENSION_ID}/view-scvm`;
export const SCVM_CARD_POPOVER_ID = `${EXTENSION_ID}/card`;
export const VIEW_ENEMY_CONTEXT_MENU_ID = `${EXTENSION_ID}/view-enemy`;
export const ENEMY_CARD_POPOVER_ID = `${EXTENSION_ID}/enemy`;

const CARD_POPOVER_WIDTH = 380;
const CARD_POPOVER_HEIGHT = 560;
const ENEMY_GM_POPOVER_WIDTH = 460;
const ENEMY_GM_POPOVER_HEIGHT = 680;

let contextMenuRegistered = false;

export function registerScvmContextMenu(): void {
  if (contextMenuRegistered) return;

  contextMenuRegistered = true;
  OBR.onReady(() => {
    void OBR.contextMenu.create(createScvmContextMenu());
    void OBR.contextMenu.create(createEnemyContextMenu());
  });
}

export function createScvmContextMenu(): ContextMenuItem {
  return {
    id: VIEW_SCVM_CONTEXT_MENU_ID,
    icons: [
      {
        icon: "/obr-icon.svg",
        label: "View scvm",
        filter: {
          roles: ["GM", "PLAYER"],
          every: [
            {
              key: ["metadata", CHARACTER_META_KEY],
              operator: "!=",
              value: undefined,
            },
          ],
        },
      },
    ],
    onClick: (context, elementId) => {
      const characterId = getContextCharacterId(context);
      if (!characterId) return;

      void OBR.popover.open({
        id: SCVM_CARD_POPOVER_ID,
        url: getObrCardUrl(characterId, OBR.room.id),
        width: CARD_POPOVER_WIDTH,
        height: CARD_POPOVER_HEIGHT,
        ...getContextMenuPopoverAnchor(elementId),
      });
    },
  };
}

export function createEnemyContextMenu(): ContextMenuItem {
  return {
    id: VIEW_ENEMY_CONTEXT_MENU_ID,
    icons: [
      {
        icon: "/obr-icon.svg",
        label: "View enemy",
        filter: {
          roles: ["GM"],
          every: [
            {
              key: ["metadata", ENEMY_META_KEY],
              operator: "!=",
              value: undefined,
            },
          ],
        },
      },
    ],
    onClick: (context, elementId) => {
      void openEnemyPopover(context, elementId);
    },
  };
}

async function openEnemyPopover(
  context: ContextMenuContext,
  elementId: string,
): Promise<void> {
  const enemyId = getContextEnemyId(context);
  if (!enemyId) return;

  await OBR.popover.open({
    id: ENEMY_CARD_POPOVER_ID,
    url: getObrEnemyUrl(enemyId),
    width: ENEMY_GM_POPOVER_WIDTH,
    height: ENEMY_GM_POPOVER_HEIGHT,
    ...getContextMenuPopoverAnchor(elementId),
  });
}

function getContextMenuPopoverAnchor(elementId: string) {
  return {
    anchorElementId: elementId,
    anchorOrigin: {
      horizontal: "RIGHT",
      vertical: "CENTER",
    },
    transformOrigin: {
      horizontal: "LEFT",
      vertical: "CENTER",
    },
    marginThreshold: 8,
  } as const;
}

export function getContextCharacterId(
  context: Pick<ContextMenuContext, "items">,
): string | null {
  const characterId = context.items[0]?.metadata[CHARACTER_META_KEY];
  return typeof characterId === "string" && characterId.trim()
    ? characterId.trim()
    : null;
}

export function getObrCardUrl(characterId: string, roomId: string): string {
  return `/obr.html?view=card&id=${encodeURIComponent(
    characterId,
  )}&room=${encodeURIComponent(roomId)}`;
}

export function getObrEnemyUrl(enemyId: string): string {
  return `/obr.html?view=enemy&id=${encodeURIComponent(enemyId)}`;
}

export function isObrCardView(
  search = window.location.search,
  pathname = window.location.pathname,
): boolean {
  return (
    new URLSearchParams(search).get("view") === "card" ||
    pathname.endsWith("/obr-card") ||
    pathname.endsWith("/obr-card.html")
  );
}

export function isObrEnemyView(
  search = window.location.search,
  pathname = window.location.pathname,
): boolean {
  return (
    new URLSearchParams(search).get("view") === "enemy" ||
    pathname.endsWith("/obr-enemy") ||
    pathname.endsWith("/obr-enemy.html")
  );
}
