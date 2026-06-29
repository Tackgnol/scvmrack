import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHARACTER_META_KEY,
  TOKEN_MARKER_CHARACTER_META_KEY,
  TOKEN_MARKER_META_KEY,
} from "@/obr/extension";
import {
  bindCharacterToSelection,
  getSelectedTokenBindingState,
} from "@/obr/tokenBinding";

type TestItem = {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
};

const obrMock = vi.hoisted(() => {
  const state = {
    selection: [] as string[] | undefined,
    items: [] as TestItem[],
    attachments: [] as TestItem[],
    addedItems: [] as TestItem[],
  };

  const createLabelBuilder = () => {
    const item: TestItem = {
      id: `marker-${state.addedItems.length + 1}`,
      name: "",
      metadata: {},
      visible: true,
      locked: false,
      createdUserId: "player-1",
      zIndex: 0,
      lastModified: "",
      lastModifiedUserId: "player-1",
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
      layer: "ATTACHMENT",
      type: "LABEL",
    };
    const builder = {
      name: vi.fn((value: string) => {
        item.name = value;
        return builder;
      }),
      plainText: vi.fn((value: string) => {
        item.text = value;
        return builder;
      }),
      width: vi.fn(() => builder),
      height: vi.fn(() => builder),
      padding: vi.fn(() => builder),
      fontFamily: vi.fn(() => builder),
      fontSize: vi.fn(() => builder),
      fontWeight: vi.fn(() => builder),
      textAlign: vi.fn(() => builder),
      textAlignVertical: vi.fn(() => builder),
      fillColor: vi.fn(() => builder),
      fillOpacity: vi.fn(() => builder),
      strokeColor: vi.fn(() => builder),
      strokeOpacity: vi.fn(() => builder),
      strokeWidth: vi.fn(() => builder),
      backgroundColor: vi.fn(() => builder),
      backgroundOpacity: vi.fn(() => builder),
      cornerRadius: vi.fn(() => builder),
      pointerWidth: vi.fn(() => builder),
      pointerHeight: vi.fn(() => builder),
      pointerDirection: vi.fn(() => builder),
      position: vi.fn((value: { x: number; y: number }) => {
        item.position = value;
        return builder;
      }),
      attachedTo: vi.fn((value: string) => {
        item.attachedTo = value;
        return builder;
      }),
      layer: vi.fn((value: string) => {
        item.layer = value;
        return builder;
      }),
      locked: vi.fn((value: boolean) => {
        item.locked = value;
        return builder;
      }),
      disableHit: vi.fn((value: boolean) => {
        item.disableHit = value;
        return builder;
      }),
      disableAutoZIndex: vi.fn((value: boolean) => {
        item.disableAutoZIndex = value;
        return builder;
      }),
      disableAttachmentBehavior: vi.fn((value: string[]) => {
        item.disableAttachmentBehavior = value;
        return builder;
      }),
      metadata: vi.fn((value: Record<string, unknown>) => {
        item.metadata = value;
        return builder;
      }),
      build: vi.fn(() => item),
    };
    return builder;
  };

  return {
    state,
    getSelection: vi.fn(() => Promise.resolve(state.selection)),
    getItems: vi.fn((filter?: string[]) =>
      Promise.resolve(
        Array.isArray(filter)
          ? state.items.filter((item) => filter.includes(item.id))
          : state.items,
      ),
    ),
    updateItems: vi.fn(async (ids: string[], update: (items: TestItem[]) => void) => {
      const selected = state.items.filter((item) => ids.includes(item.id));
      update(selected);
    }),
    getItemAttachments: vi.fn(() => Promise.resolve(state.attachments)),
    deleteItems: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getItemBounds: vi.fn(() =>
      Promise.resolve({
        min: { x: 10, y: 20 },
        max: { x: 90, y: 110 },
        width: 80,
        height: 90,
        center: { x: 50, y: 65 },
      }),
    ),
    addItems: vi.fn((items: TestItem[]) => {
      state.addedItems.push(...items);
      return Promise.resolve();
    }),
    sendMessage: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    buildLabel: vi.fn(createLabelBuilder),
  };
});

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    player: {
      getSelection: obrMock.getSelection,
    },
    scene: {
      items: {
        getItems: obrMock.getItems,
        updateItems: obrMock.updateItems,
        getItemAttachments: obrMock.getItemAttachments,
        deleteItems: obrMock.deleteItems,
        getItemBounds: obrMock.getItemBounds,
        addItems: obrMock.addItems,
      },
    },
    broadcast: {
      sendMessage: obrMock.sendMessage,
    },
  },
  buildLabel: obrMock.buildLabel,
}));

describe("OBR token binding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obrMock.state.selection = [];
    obrMock.state.items = [];
    obrMock.state.attachments = [];
    obrMock.state.addedItems = [];
  });

  it("reports selected tokens that already have scvmrack metadata", async () => {
    obrMock.state.selection = ["token-1", "token-2"];
    obrMock.state.items = [
      {
        id: "token-1",
        name: "Bound",
        metadata: { [CHARACTER_META_KEY]: "char-1" },
      },
      { id: "token-2", name: "Plain", metadata: {} },
    ];

    await expect(getSelectedTokenBindingState()).resolves.toEqual({
      selectedIds: ["token-1", "token-2"],
      selectedCount: 2,
      hasSelection: true,
      hasBoundToken: true,
      boundCharacterIds: ["char-1"],
    });
  });

  it("binds selected tokens, replaces markers, and broadcasts roster changes", async () => {
    obrMock.state.selection = ["token-1"];
    obrMock.state.items = [{ id: "token-1", name: "Old", metadata: {} }];
    obrMock.state.attachments = [
      {
        id: "old-marker",
        name: "Old marker",
        metadata: { [TOKEN_MARKER_META_KEY]: true },
      },
    ];

    await expect(bindCharacterToSelection("char-1", "Rotmaw")).resolves.toBe(1);

    expect(obrMock.state.items[0]).toMatchObject({
      name: "Rotmaw",
      metadata: { [CHARACTER_META_KEY]: "char-1" },
    });
    expect(obrMock.deleteItems).toHaveBeenCalledWith(["old-marker"]);
    expect(obrMock.addItems).toHaveBeenCalledOnce();
    expect(obrMock.state.addedItems[0]).toMatchObject({
      name: "Scvmrack binding: Rotmaw",
      text: "Rotmaw",
      attachedTo: "token-1",
      layer: "ATTACHMENT",
      locked: true,
      disableHit: true,
      metadata: {
        [TOKEN_MARKER_META_KEY]: true,
        [TOKEN_MARKER_CHARACTER_META_KEY]: "char-1",
      },
    });
    expect(obrMock.state.addedItems[0].position).toEqual({ x: 50, y: 2 });
    expect(obrMock.sendMessage).toHaveBeenCalledWith(
      "co.rpgtools.scvmrack/roster",
      { kind: "roster" },
      { destination: "ALL" },
    );
  });
});
