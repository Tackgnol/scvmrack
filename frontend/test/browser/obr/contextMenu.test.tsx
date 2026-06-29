import { ENEMY_META_KEY } from "@/obr/enemies";
import { CHARACTER_META_KEY, EXTENSION_ID } from "@/obr/extension";
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
    },
    room: {
      id: "room-ctx",
    },
  },
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
    items: [{ metadata } as ContextMenuContext["items"][number]],
    selectionBounds: {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
      width: 0,
      height: 0,
      center: { x: 0, y: 0 },
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

  it("creates a view-enemy menu filtered to bound GM tokens", () => {
    const menu = createEnemyContextMenu();

    expect(menu.id).toBe(`${EXTENSION_ID}/view-enemy`);
    expect(menu.icons[0]).toMatchObject({
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
      url: `/obr.html?view=card&id=${characterId}&room=room-ctx`,
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

  it("opens the enemy editor popover near the context menu item", async () => {
    const menu = createEnemyContextMenu();

    menu.onClick?.(
      contextWithMetadata({ [ENEMY_META_KEY]: "enemy-1" }),
      "element-id",
    );

    await expect
      .poll(() => obrMock.open)
      .toHaveBeenCalledWith({
        id: ENEMY_CARD_POPOVER_ID,
        url: "/obr.html?view=enemy&id=enemy-1",
        width: 460,
        height: 680,
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
      "/obr.html?view=card&id=c%201&room=r%202",
    );
    expect(getObrEnemyUrl("enemy 1")).toBe("/obr.html?view=enemy&id=enemy%201");
    expect(isObrCardView("?view=card&id=c1", "/obr.html")).toBe(true);
    expect(isObrCardView("?id=c1", "/obr-card")).toBe(true);
    expect(isObrCardView("?id=c1", "/obr.html")).toBe(false);
    expect(isObrEnemyView("?view=enemy&id=e1", "/obr.html")).toBe(true);
    expect(isObrEnemyView("?id=e1", "/obr-enemy")).toBe(true);
    expect(isObrEnemyView("?id=e1", "/obr.html")).toBe(false);
  });
});
