import { ENEMY_META_KEY } from "@/obr/enemies";
import {
  CHARACTER_META_KEY,
  EXTENSION_ID,
  PLAYER_CHARACTER_META_KEY,
} from "@/obr/extension";
import type { ContextMenuContext } from "@owlbear-rodeo/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obrMock = vi.hoisted(() => ({
  onReady: vi.fn((callback: () => void) => {
    callback();
  }),
  create: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  open: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  getRole: vi.fn<() => Promise<"GM" | "PLAYER">>(() =>
    Promise.resolve("PLAYER"),
  ),
  getMetadata: vi.fn<() => Promise<Record<string, unknown>>>(() =>
    Promise.resolve({ [PLAYER_CHARACTER_META_KEY]: "character-player-1" }),
  ),
  transformPoint: vi.fn((point: { x: number; y: number }) =>
    Promise.resolve({ x: point.x, y: point.y }),
  ),
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: obrMock.onReady,
    contextMenu: {
      create: obrMock.create,
    },
    popover: {
      open: obrMock.open,
    },
    player: {
      getRole: obrMock.getRole,
      getMetadata: obrMock.getMetadata,
    },
    room: {
      id: "room-ctx",
    },
    viewport: {
      transformPoint: obrMock.transformPoint,
    },
  },
  // contextMenu.ts now shares getCharacterIdFromMetadata with roomBinding.ts,
  // which pulls in tokenBinding.ts's use of buildLabel; unused in this
  // test's flow, so a no-op stub satisfies the module graph.
  buildLabel: vi.fn(),
}));

import {
  createEnemyContextMenu,
  createScvmContextMenu,
  ENEMY_CARD_POPOVER_ID,
  getContextCharacterId,
  getObrCardUrl,
  getObrEnemyUrl,
  isObrCardView,
  isObrEnemyView,
  registerScvmContextMenu,
  SCVM_CARD_POPOVER_ID,
  VIEW_ENEMY_CONTEXT_MENU_ID,
  VIEW_SCVM_CONTEXT_MENU_ID,
} from "@/obr/contextMenu";

function contextWithMetadata(
  metadata: Record<string, unknown>,
): ContextMenuContext {
  return {
    items: [
      { id: "token-ctx", metadata } as ContextMenuContext["items"][number],
    ],
    selectionBounds: {
      min: { x: 80, y: 20 },
      max: { x: 120, y: 60 },
      width: 40,
      height: 40,
      center: { x: 100, y: 40 },
    },
  };
}

describe("OBR context menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obrMock.getRole.mockResolvedValue("PLAYER");
  });

  it("creates a view-scvm menu filtered to bound GM and player tokens", () => {
    const menu = createScvmContextMenu();

    expect(menu.id).toBe(`${EXTENSION_ID}/view-scvm`);
    expect(menu.icons[0]).toMatchObject({
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
    });
  });

  it("creates a view-enemy menu filtered to bound GM and player tokens", () => {
    const menu = createEnemyContextMenu();

    expect(menu.id).toBe(`${EXTENSION_ID}/view-enemy`);
    expect(menu.icons[0]).toMatchObject({
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
    });
  });

  it("opens the compact card popover for the token character id", () => {
    const menu = createScvmContextMenu();
    const characterId = "f15c7ec3-dad2-4f65-8b69-0f1f642c7d29";

    menu.onClick?.(
      contextWithMetadata({ [CHARACTER_META_KEY]: characterId }),
      "element-id",
    );

    expect(obrMock.open).toHaveBeenCalledWith({
      id: SCVM_CARD_POPOVER_ID,
      url: `/obr.html?view=card&id=${characterId}&room=room-ctx&token=token-ctx`,
      width: 380,
      height: 560,
      anchorElementId: "element-id",
      anchorOrigin: {
        horizontal: "RIGHT",
        vertical: "CENTER",
      },
      transformOrigin: {
        horizontal: "LEFT",
        vertical: "CENTER",
      },
      marginThreshold: 8,
    });
  });

  it("ignores context-menu clicks without a bound character id", () => {
    const menu = createScvmContextMenu();

    menu.onClick?.(
      contextWithMetadata({ [CHARACTER_META_KEY]: 7 }),
      "element-id",
    );

    expect(obrMock.open).not.toHaveBeenCalled();
  });

  it("opens the player enemy card popover near the selected token", async () => {
    const menu = createEnemyContextMenu();

    menu.onClick?.(
      contextWithMetadata({ [ENEMY_META_KEY]: "enemy-1" }),
      "element-id",
    );

    await expect
      .poll(() => obrMock.open)
      .toHaveBeenCalledWith({
        id: ENEMY_CARD_POPOVER_ID,
        url: "/obr.html?view=enemy&id=enemy-1&room=room-ctx&token=token-ctx&character=character-player-1",
        width: 360,
        height: 260,
        anchorReference: "POSITION",
        anchorPosition: {
          left: 132,
          top: 40,
        },
        anchorOrigin: {
          horizontal: "LEFT",
          vertical: "CENTER",
        },
        transformOrigin: {
          horizontal: "LEFT",
          vertical: "CENTER",
        },
        marginThreshold: 8,
      });
  });

  it("opens the GM enemy editor popover from a bound enemy token", async () => {
    obrMock.getRole.mockResolvedValueOnce("GM");
    const menu = createEnemyContextMenu();

    menu.onClick?.(
      contextWithMetadata({ [ENEMY_META_KEY]: "enemy-1" }),
      "element-id",
    );

    await expect
      .poll(() => obrMock.open)
      .toHaveBeenCalledWith({
        id: ENEMY_CARD_POPOVER_ID,
        url: "/obr.html?view=enemy&id=enemy-1&room=room-ctx&token=token-ctx",
        width: 460,
        height: 680,
        anchorReference: "POSITION",
        anchorPosition: {
          left: 132,
          top: 40,
        },
        anchorOrigin: {
          horizontal: "LEFT",
          vertical: "CENTER",
        },
        transformOrigin: {
          horizontal: "LEFT",
          vertical: "CENTER",
        },
        marginThreshold: 8,
      });
  });

  it("registers the menu when OBR is ready", () => {
    registerScvmContextMenu();

    expect(obrMock.onReady).toHaveBeenCalledOnce();
    expect(obrMock.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: VIEW_SCVM_CONTEXT_MENU_ID }),
    );
    expect(obrMock.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: VIEW_ENEMY_CONTEXT_MENU_ID }),
    );
  });

  it("extracts ids and recognizes compact card URLs", () => {
    expect(
      getContextCharacterId(
        contextWithMetadata({ [CHARACTER_META_KEY]: " c1 " }),
      ),
    ).toBe("c1");
    expect(getObrCardUrl("c 1", "r 2")).toBe(
      "/obr.html?view=card&id=c+1&room=r+2",
    );
    expect(getObrCardUrl("c 1", "r 2", "t 3")).toBe(
      "/obr.html?view=card&id=c+1&room=r+2&token=t+3",
    );
    expect(getObrEnemyUrl("enemy 1")).toBe("/obr.html?view=enemy&id=enemy+1");
    expect(getObrEnemyUrl("enemy 1", "room 2", "token 3", "char 4")).toBe(
      "/obr.html?view=enemy&id=enemy+1&room=room+2&token=token+3&character=char+4",
    );
    expect(isObrCardView("?view=card&id=c1", "/obr.html")).toBe(true);
    expect(isObrCardView("?id=c1", "/obr-card")).toBe(true);
    expect(isObrCardView("?id=c1", "/obr.html")).toBe(false);
    expect(isObrEnemyView("?view=enemy&id=e1", "/obr.html")).toBe(true);
    expect(isObrEnemyView("?id=e1", "/obr-enemy")).toBe(true);
    expect(isObrEnemyView("?id=e1", "/obr.html")).toBe(false);
  });
});
