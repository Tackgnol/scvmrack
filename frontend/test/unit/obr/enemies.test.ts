import { beforeEach, describe, expect, it, vi } from "vitest";

const obrMock = vi.hoisted(() => {
  const state = {
    selection: [] as string[],
    items: [] as Array<{
      metadata: Record<string, unknown>;
      name?: string;
      text?: {
        plainText: string;
        richText: Array<{
          type: "paragraph";
          children: Array<{ text: string }>;
        }>;
        type: "PLAIN" | "RICH";
      };
      textItemType?: "LABEL" | "TEXT";
    }>,
    updatedItems: [] as Array<{
      metadata: Record<string, unknown>;
      name?: string;
      text?: {
        plainText: string;
        richText: Array<{
          type: "paragraph";
          children: Array<{ text: string }>;
        }>;
        type: "PLAIN" | "RICH";
      };
      textItemType?: "LABEL" | "TEXT";
    }>,
  };

  return {
    state,
    sendMessage: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    getSelection: vi.fn<() => Promise<string[]>>(() =>
      Promise.resolve(state.selection),
    ),
    updateItems: vi.fn<
      (
        ids: string[],
        updater: (
          items: Array<{ metadata: Record<string, unknown>; name?: string }>,
        ) => void,
      ) => Promise<void>
    >(async (ids, updater) => {
      const items = ids.map(
        (_, index) =>
          state.items[index] ?? {
            metadata: {} as Record<string, unknown>,
          },
      );
      updater(items);
      state.updatedItems = items;
    }),
  };
});

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    broadcast: {
      sendMessage: obrMock.sendMessage,
    },
    player: {
      getSelection: obrMock.getSelection,
    },
    scene: {
      items: {
        updateItems: obrMock.updateItems,
      },
    },
  },
}));

import {
  bindEnemyToSelection,
  ENEMY_META_KEY,
  OBR_ENEMIES_CHANNEL,
  broadcastEnemiesChanged,
  resolveEnemyStatus,
  type ObrEnemy,
} from "@/obr/enemies";

const enemy: ObrEnemy = {
  id: "enemy-1",
  name: "Ash Wight",
  type: "Undead",
  habitat: "Ash chapel",
  description: "A public warning from the GM.",
  playerDescription: "Ash shakes from its jaw.",
  currentHealth: 5,
  healthPercent: 60,
  maxHealth: 8,
  morale: 7,
  armorDie: "-d2",
  armorDescription: "Soot-caked bones",
  attacks: [{ id: "attack-1", name: "Ash claw", die: "d6" }],
  specials: [
    {
      id: "special-1",
      name: "Choking ash",
      description: "Presence DR12 or cough blood.",
    },
  ],
  loot: [{ id: "loot-1", label: "Relic ash", value: "20s" }],
  statuses: [
    { id: "near-dead", percent: 25, label: "At death's door" },
    { id: "hurt", percent: 75, label: "Wounded" },
    { id: "whole", percent: 100, label: "Healthy" },
  ],
};

describe("OBR enemies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obrMock.state.selection = [];
    obrMock.state.items = [];
    obrMock.state.updatedItems = [];
  });

  it("resolves status bands as upper health thresholds", () => {
    expect(resolveEnemyStatus({ ...enemy, healthPercent: 90 }).label).toBe(
      "Healthy",
    );
    expect(resolveEnemyStatus({ ...enemy, healthPercent: 60 }).label).toBe(
      "Wounded",
    );
    expect(resolveEnemyStatus({ ...enemy, healthPercent: 10 }).label).toBe(
      "At death's door",
    );
  });

  it("broadcasts enemy roster refresh pings without storing room metadata", async () => {
    await broadcastEnemiesChanged();

    expect(obrMock.sendMessage).toHaveBeenCalledWith(
      OBR_ENEMIES_CHANNEL,
      { kind: "enemies" },
      { destination: "ALL" },
    );
  });

  it("binds an enemy id onto the selected scene tokens", async () => {
    obrMock.state.selection = ["token-1", "token-2"];

    await expect(bindEnemyToSelection(enemy)).resolves.toBe(2);

    expect(obrMock.updateItems).toHaveBeenCalledWith(
      ["token-1", "token-2"],
      expect.any(Function),
    );
    expect(obrMock.state.updatedItems).toEqual([
      { metadata: { [ENEMY_META_KEY]: enemy.id }, name: enemy.name },
      { metadata: { [ENEMY_META_KEY]: enemy.id }, name: enemy.name },
    ]);
  });

  it("sets visible image token text when binding an enemy", async () => {
    obrMock.state.selection = ["token-1"];
    obrMock.state.items = [
      {
        metadata: {},
        text: {
          plainText: "Old name",
          richText: [{ type: "paragraph", children: [{ text: "Old name" }] }],
          type: "PLAIN",
        },
        textItemType: "TEXT",
      },
    ];

    await expect(bindEnemyToSelection(enemy)).resolves.toBe(1);

    expect(obrMock.state.updatedItems).toEqual([
      {
        metadata: { [ENEMY_META_KEY]: enemy.id },
        name: enemy.name,
        text: {
          plainText: enemy.name,
          richText: [{ type: "paragraph", children: [{ text: enemy.name }] }],
          type: "PLAIN",
        },
        textItemType: "LABEL",
      },
    ]);
  });

  it("does not bind when no token is selected", async () => {
    await expect(bindEnemyToSelection(enemy)).resolves.toBe(0);

    expect(obrMock.updateItems).not.toHaveBeenCalled();
  });
});
