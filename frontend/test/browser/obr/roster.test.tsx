import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHARACTER_META_KEY } from "@/obr/extension";
import {
  broadcastCharacterCardChanged,
  broadcastRosterChanged,
  getBoundCharacterIds,
  OBR_ROSTER_CHANNEL,
} from "@/obr/roster";

const obrMock = vi.hoisted(() => {
  const state = {
    sceneReady: false,
    items: [] as Array<{ metadata: Record<string, unknown> }>,
  };

  return {
    state,
    isReady: vi.fn<() => Promise<boolean>>(() =>
      Promise.resolve(state.sceneReady),
    ),
    getItems: vi.fn<
      () => Promise<Array<{ metadata: Record<string, unknown> }>>
    >(() => Promise.resolve(state.items)),
    sendMessage: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  };
});

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    scene: {
      isReady: obrMock.isReady,
      items: {
        getItems: obrMock.getItems,
      },
    },
    broadcast: {
      sendMessage: obrMock.sendMessage,
    },
  },
}));

describe("OBR roster helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obrMock.state.sceneReady = false;
    obrMock.state.items = [];
  });

  it("returns no bound character ids when the scene is not ready", async () => {
    await expect(getBoundCharacterIds()).resolves.toEqual([]);
    expect(obrMock.getItems).not.toHaveBeenCalled();
  });

  it("collects distinct bound character ids from scene item metadata", async () => {
    obrMock.state.sceneReady = true;
    obrMock.state.items = [
      { metadata: { [CHARACTER_META_KEY]: "c1" } },
      { metadata: { [CHARACTER_META_KEY]: "c2" } },
      { metadata: { [CHARACTER_META_KEY]: "c1" } },
      { metadata: { [CHARACTER_META_KEY]: "" } },
      { metadata: { [CHARACTER_META_KEY]: 7 } },
      { metadata: {} },
    ];

    await expect(getBoundCharacterIds()).resolves.toEqual(["c1", "c2"]);
  });

  it("broadcasts roster and card pulses on the shared OBR channel", async () => {
    await broadcastRosterChanged();
    await broadcastCharacterCardChanged("c1");

    expect(obrMock.sendMessage).toHaveBeenNthCalledWith(
      1,
      OBR_ROSTER_CHANNEL,
      { kind: "roster" },
      { destination: "ALL" },
    );
    expect(obrMock.sendMessage).toHaveBeenNthCalledWith(
      2,
      OBR_ROSTER_CHANNEL,
      { kind: "card", characterId: "c1" },
      { destination: "ALL" },
    );
  });
});
