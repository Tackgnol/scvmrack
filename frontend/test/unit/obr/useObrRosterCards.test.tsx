import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, test, vi } from "vitest";
import type { ReactNode } from "react";

const coreMocks = vi.hoisted(() => ({
  rows: [] as any[],
  unassignPlayer: vi.fn(async (_playerId: string) => {}),
  unbindToken: vi.fn(async (_tokenId: string) => {}),
  refresh: vi.fn(async () => {}),
}));

vi.mock("@tackgnol/rpgtools-owlbear/react-query", () => ({
  useObrRosterCards: () => ({
    rows: coreMocks.rows,
    cards: [],
    connectedPlayers: [],
    isLoading: false,
    action: { pending: false, message: null, error: null },
    sceneReady: true,
    refresh: coreMocks.refresh,
    bindSelectedToken: vi.fn(),
    assignPlayer: vi.fn(),
    unassignPlayer: coreMocks.unassignPlayer,
    unbindToken: coreMocks.unbindToken,
  }),
  toRosterRows: vi.fn(),
}));

const partyMocks = vi.hoisted(() => ({
  roomPartyData: null as { id: string; members: { characterId: string }[] } | null,
  kickMutateAsync: vi.fn(async (_characterId: string) => {}),
}));

vi.mock("@/hooks/usePartyRepository", () => ({
  useObrRoomParty: () => ({ data: partyMocks.roomPartyData }),
  useKickPartyMember: () => ({ mutateAsync: partyMocks.kickMutateAsync }),
}));

vi.mock("@/obr/useObrRoomId", () => ({
  useObrRoomId: () => "room-1",
}));

vi.mock("@/obr/extension", () => ({ scvmrackObrExtension: {} }));
vi.mock("@/obr/obrApiClient", () => ({ obrApiClient: {} }));
vi.mock("@owlbear-rodeo/sdk", () => ({ default: {} }));

vi.mock("@/api/party", () => ({
  partyKeys: { obrRoom: (id: string) => ["party", "obr-room", id] },
  promoteObrRoom: vi.fn(async () => ({})),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "en" },
  }),
}));

import { useObrRosterCards } from "../../../src/obr/useObrRosterCards.ts";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  coreMocks.rows = [];
  coreMocks.unassignPlayer.mockClear();
  coreMocks.unbindToken.mockClear();
  coreMocks.refresh.mockClear();
  partyMocks.roomPartyData = null;
  partyMocks.kickMutateAsync.mockClear();
});

test("removeFromRoster clears every player and token binding for that scvm, then refreshes (RPG-55)", async () => {
  coreMocks.rows = [
    {
      id: "char-1",
      characterId: "char-1",
      card: null,
      players: [{ playerId: "player-a" }, { playerId: "player-b" }],
      tokens: [{ tokenId: "token-a" }],
    },
  ];

  const { result } = renderHook(() => useObrRosterCards(), { wrapper });

  await result.current.removeFromRoster("char-1");

  expect(coreMocks.unassignPlayer).toHaveBeenCalledWith("player-a");
  expect(coreMocks.unassignPlayer).toHaveBeenCalledWith("player-b");
  expect(coreMocks.unbindToken).toHaveBeenCalledWith("token-a");
  expect(coreMocks.refresh).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(result.current.removeRosterAction).toEqual({
      characterId: "char-1",
      pending: false,
      error: null,
    }),
  );
});

test("removeFromRoster also kicks the character from its linked persistent party", async () => {
  partyMocks.roomPartyData = {
    id: "party-1",
    members: [{ characterId: "char-1" }],
  };
  coreMocks.rows = [
    {
      id: "char-1",
      characterId: "char-1",
      card: null,
      players: [],
      tokens: [],
    },
  ];

  const { result } = renderHook(() => useObrRosterCards(), { wrapper });

  await result.current.removeFromRoster("char-1");

  expect(partyMocks.kickMutateAsync).toHaveBeenCalledWith("char-1");
});

test("removeFromRoster does not kick a character that isn't a party member", async () => {
  partyMocks.roomPartyData = {
    id: "party-1",
    members: [{ characterId: "someone-else" }],
  };
  coreMocks.rows = [
    {
      id: "char-1",
      characterId: "char-1",
      card: null,
      players: [],
      tokens: [],
    },
  ];

  const { result } = renderHook(() => useObrRosterCards(), { wrapper });

  await result.current.removeFromRoster("char-1");

  expect(partyMocks.kickMutateAsync).not.toHaveBeenCalled();
});

test("removeFromRoster surfaces a partial failure without a false-success message", async () => {
  coreMocks.rows = [
    {
      id: "char-1",
      characterId: "char-1",
      card: null,
      players: [{ playerId: "player-a" }],
      tokens: [{ tokenId: "token-a" }],
    },
  ];
  coreMocks.unbindToken.mockRejectedValueOnce(new Error("token gone"));

  const { result } = renderHook(() => useObrRosterCards(), { wrapper });

  await result.current.removeFromRoster("char-1");

  expect(coreMocks.refresh).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(result.current.removeRosterAction).toEqual({
      characterId: "char-1",
      pending: false,
      error: "token gone",
    }),
  );
});
