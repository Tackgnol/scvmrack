import { obrAuthClient } from "@/auth/obrAuthClient";
import OBR, {
  type ContextMenuContext,
  type ContextMenuItem,
} from "@owlbear-rodeo/sdk";
import {
  getCharacterIdFromMetadata,
  getContextCharacterId as getContextCharacterIdCore,
  getContextMenuPopoverAnchor,
  registerObrContextMenus,
} from "@tackgnol/rpgtools-owlbear";
import { ENEMY_META_KEY, getContextEnemyId } from "./enemies";
import { CHARACTER_META_KEY, EXTENSION_ID, scvmrackObrExtension } from "./extension";

export const VIEW_SCVM_CONTEXT_MENU_ID = `${EXTENSION_ID}/view-scvm`;
export const OPEN_FULL_SITE_CONTEXT_MENU_ID = `${EXTENSION_ID}/open-full-site`;
export const SCVM_CARD_POPOVER_ID = `${EXTENSION_ID}/card`;
export const VIEW_ENEMY_CONTEXT_MENU_ID = `${EXTENSION_ID}/view-enemy`;
export const ENEMY_CARD_POPOVER_ID = `${EXTENSION_ID}/enemy`;

const CARD_POPOVER_WIDTH = 380;
const CARD_POPOVER_HEIGHT = 560;
const ENEMY_CARD_POPOVER_WIDTH = 360;
const ENEMY_CARD_POPOVER_HEIGHT = 260;
const ENEMY_GM_POPOVER_WIDTH = 460;
const ENEMY_GM_POPOVER_HEIGHT = 680;

export function registerScvmContextMenu(): void {
  registerObrContextMenus(OBR, [createScvmContextMenu(), createOpenFullSiteContextMenu(), createEnemyContextMenu()]);
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
        url: getObrCardUrl(characterId, OBR.room.id, context.items[0]?.id),
        width: CARD_POPOVER_WIDTH,
        height: CARD_POPOVER_HEIGHT,
        ...getContextMenuPopoverAnchor(elementId),
      });
    },
  };
}
export function createOpenFullSiteContextMenu(): ContextMenuItem {
  return {
    id: OPEN_FULL_SITE_CONTEXT_MENU_ID,
    icons: [
      {
        icon: "/obr-icon.svg",
        label: "Open in full site",
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
    onClick: (context) => {
      const characterId = getContextCharacterId(context);
      if (!characterId) return;

      void openFullSite(characterId);
    },
  };
}

async function openFullSite(characterId: string): Promise<void> {
  try {
    const token = await obrAuthClient.issueObrExchangeToken();
    const opened = window.open(
      `/obr-open?token=${encodeURIComponent(token)}&character=${encodeURIComponent(characterId)}`,
      "_blank",
      "noopener,noreferrer",
    );
    if (opened) return;
  } catch {
    // The same retry message covers token issuance and blocked tabs.
  }

  await OBR.notification.show(
    "Could not open a new tab. Allow popups and try Open in full site again.",

    "ERROR",
  );
}
export function createEnemyContextMenu(): ContextMenuItem {
  return {
    id: VIEW_ENEMY_CONTEXT_MENU_ID,
    icons: [
      {
        icon: "/obr-icon.svg",
        label: "View enemy",
        filter: {
          roles: ["GM", "PLAYER"],
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

  const role = await OBR.player.getRole().catch(() => "PLAYER" as const);
  const playerCharacterId =
    role === "PLAYER" ? await getCurrentPlayerCharacterId() : null;
  const anchor = await getSelectionBoundsPopoverAnchor(context, elementId);

  await OBR.popover.open({
    id: ENEMY_CARD_POPOVER_ID,
    url: getObrEnemyUrl(
      enemyId,
      OBR.room.id,
      context.items[0]?.id,
      playerCharacterId,
    ),
    width: role === "GM" ? ENEMY_GM_POPOVER_WIDTH : ENEMY_CARD_POPOVER_WIDTH,
    height:
      role === "GM" ? ENEMY_GM_POPOVER_HEIGHT : ENEMY_CARD_POPOVER_HEIGHT,
    ...anchor,
  });
}

async function getCurrentPlayerCharacterId(): Promise<string | null> {
  const metadata = await OBR.player.getMetadata().catch(() => null);
  return metadata ? getCharacterIdFromMetadata(scvmrackObrExtension, metadata) : null;
}

async function getSelectionBoundsPopoverAnchor(
  context: ContextMenuContext,
  elementId: string,
) {
  const tokenAnchor = await getSelectionBoundsAnchorPosition(context);
  if (!tokenAnchor) {
    return getContextMenuPopoverAnchor(elementId);
  }

  return {
    anchorReference: "POSITION",
    anchorPosition: tokenAnchor,
    anchorOrigin: {
      horizontal: "LEFT",
      vertical: "CENTER",
    },
    transformOrigin: {
      horizontal: "LEFT",
      vertical: "CENTER",
    },
    marginThreshold: 8,
  } as const;
}

async function getSelectionBoundsAnchorPosition(
  context: ContextMenuContext,
): Promise<{ left: number; top: number } | null> {
  const bounds = context.selectionBounds;
  if (!isFiniteNumber(bounds.max.x) || !isFiniteNumber(bounds.center.y)) {
    return null;
  }

  try {
    const point = await OBR.viewport.transformPoint({
      x: bounds.max.x,
      y: bounds.center.y,
    });
    if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
      return null;
    }

    return { left: Math.round(point.x + 12), top: Math.round(point.y) };
  } catch {
    return null;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getContextCharacterId(
  context: Pick<ContextMenuContext, "items">,
): string | null {
  return getContextCharacterIdCore(scvmrackObrExtension, context);
}

export function getObrCardUrl(
  characterId: string,
  roomId: string,
  tokenId?: string,
): string {
  const params = new URLSearchParams({
    view: "card",
    id: characterId,
    room: roomId,
  });
  if (tokenId?.trim()) {
    params.set("token", tokenId.trim());
  }
  return `/obr.html?${params.toString()}`;
}

export function getObrEnemyUrl(
  enemyId: string,
  roomId?: string | null,
  tokenId?: string | null,
  characterId?: string | null,
): string {
  const params = new URLSearchParams({
    view: "enemy",
    id: enemyId,
  });
  if (roomId?.trim()) {
    params.set("room", roomId.trim());
  }
  if (tokenId?.trim()) {
    params.set("token", tokenId.trim());
  }
  if (characterId?.trim()) {
    params.set("character", characterId.trim());
  }
  return `/obr.html?${params.toString()}`;
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
