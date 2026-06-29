import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnemyCard, EnemyFull } from "@/api/enemies";

const obrMock = vi.hoisted(() => ({
  broadcast: vi.fn<(...args: unknown[]) => Promise<void>>(() =>
    Promise.resolve(),
  ),
  onMessage: vi.fn(() => vi.fn()),
  onReady: vi.fn((callback: () => void) => {
    callback();
  }),
}));

vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: obrMock.onReady,
    broadcast: {
      sendMessage: obrMock.broadcast,
      onMessage: obrMock.onMessage,
    },
  },
}));

const apiMock = vi.hoisted(() => ({
  fetchEnemiesFull: vi.fn(),
  fetchEnemyCards: vi.fn(),
  createEnemy: vi.fn(),
  updateEnemy: vi.fn(),
  setEnemyHealth: vi.fn(),
  deleteEnemy: vi.fn(),
}));

vi.mock("@/api/enemies", () => ({
  fetchEnemiesFull: apiMock.fetchEnemiesFull,
  fetchEnemyCards: apiMock.fetchEnemyCards,
  createEnemy: apiMock.createEnemy,
  updateEnemy: apiMock.updateEnemy,
  setEnemyHealth: apiMock.setEnemyHealth,
  deleteEnemy: apiMock.deleteEnemy,
}));

const { useObrEnemies } = await import("@/obr/useObrEnemies");

const ENEMY: EnemyFull = {
  id: "22222222-2222-4222-8222-222222222222",
  partyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Goblin",
  type: "",
  habitat: "",
  description: "",
  playerDescription: "",
  currentHealth: 4,
  healthPercent: 50,
  maxHealth: 8,
  morale: 7,
  armorDie: "",
  armorDescription: "",
  attacks: [],
  specials: [],
  loot: [],
  statuses: [{ id: "h", percent: 100, label: "Healthy" }],
};

const CARD: EnemyCard = {
  id: ENEMY.id,
  name: "Goblin",
  type: "",
  habitat: "",
  playerDescription: "",
  healthPercent: 50,
  statusId: "severely-wounded",
  statusLabel: "Severely wounded",
};

beforeEach(() => {
  apiMock.fetchEnemiesFull.mockResolvedValue([ENEMY]);
  apiMock.fetchEnemyCards.mockResolvedValue([]);
  apiMock.createEnemy.mockResolvedValue(ENEMY);
  apiMock.updateEnemy.mockResolvedValue(ENEMY);
  apiMock.setEnemyHealth.mockResolvedValue(ENEMY);
  apiMock.deleteEnemy.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useObrEnemies", () => {
  it("GM mode loads full enemies from the backend by room", async () => {
    const { result } = renderHook(() =>
      useObrEnemies({ mode: "gm", roomId: "room-1" }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));
    await waitFor(() => expect(result.current.enemies).toHaveLength(1));

    expect(apiMock.fetchEnemiesFull).toHaveBeenCalledWith("room-1");
  });

  it("player mode loads safe cards with the active character id", async () => {
    apiMock.fetchEnemyCards.mockResolvedValue([CARD]);

    const { result } = renderHook(() =>
      useObrEnemies({
        mode: "player",
        roomId: "room-1",
        characterId: "11111111-1111-4111-8111-111111111111",
      }),
    );

    await waitFor(() => expect(result.current.enemies).toHaveLength(1));

    expect(apiMock.fetchEnemyCards).toHaveBeenCalledWith(
      "room-1",
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("GM save calls the API then broadcasts a change ping", async () => {
    const { result } = renderHook(() =>
      useObrEnemies({ mode: "gm", roomId: "room-1" }),
    );
    const draft: EnemyFull = { ...ENEMY, id: "enemy-local" };

    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      await result.current.saveEnemy(draft);
    });

    expect(apiMock.createEnemy).toHaveBeenCalled();
    expect(obrMock.broadcast).toHaveBeenCalledWith(
      "co.rpgtools.scvmrack/enemies",
      { kind: "enemies" },
      { destination: "ALL" },
    );
  });
});
