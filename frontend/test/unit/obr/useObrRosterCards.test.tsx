import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useObrRosterCards } from "@/obr/useObrRosterCards";
import {
  fetchRoomParticipation,
  removeRoomCharacter,
  type RoomParticipation,
} from "@/api/roomParticipation";
import { finishSceneCleanup } from "@/obr/sceneCleanup";

vi.mock("@/obr/useObrRoomId", () => ({ useObrRoomId: () => "room" }));
vi.mock("@/hooks/usePartyStream", () => ({ usePartyStream: vi.fn() }));
vi.mock("@/obr/sceneCleanup", () => ({ finishSceneCleanup: vi.fn() }));
vi.mock("@/api/roomParticipation", async (original) => ({
  ...(await original<typeof import("@/api/roomParticipation")>()),
  fetchRoomParticipation: vi.fn(),
  removeRoomCharacter: vi.fn(),
}));
vi.mock("@owlbear-rodeo/sdk", () => ({
  default: {
    onReady: (callback: () => void) => {
      callback();
      return () => {};
    },
    scene: { onReadyChange: () => () => {} },
  },
}));
vi.mock("@tackgnol/rpgtools-owlbear/react-query", () => ({
  useObrRosterCards: () => ({
    action: { pending: false, error: null },
    refresh: vi.fn(),
  }),
  toRosterRows: vi.fn(),
}));

const empty: RoomParticipation = {
  partyId: null,
  memberIds: [],
  players: [],
  tokens: [],
  cleanup: [],
  canManage: true,
};
beforeEach(() => {
  vi.mocked(fetchRoomParticipation).mockReset().mockResolvedValue(empty);
  vi.mocked(removeRoomCharacter).mockReset();
  vi.mocked(finishSceneCleanup).mockReset().mockResolvedValue(true);
});
function roster() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useObrRosterCards(), { wrapper });
}

it("reuses the removal operation after a lost response and allocates a new one after success", async () => {
  vi.mocked(removeRoomCharacter)
    .mockRejectedValueOnce(new Error("response lost"))
    .mockResolvedValue(empty);
  const { result } = roster();
  await act(async () => result.current.removeFromRoster("scvm"));
  expect(result.current.removeRosterAction?.error).toBe("response lost");
  await act(async () => result.current.removeFromRoster("scvm"));
  const calls = vi.mocked(removeRoomCharacter).mock.calls;
  expect(calls[0][2]).toBe(calls[1][2]);
  expect(result.current.removeRosterAction?.error).toBeNull();
  await act(async () => result.current.removeFromRoster("scvm"));
  expect(calls[2][2]).not.toBe(calls[1][2]);
});

it("retries pending scene cleanup without issuing a second removal command", async () => {
  const pending: RoomParticipation = {
    ...empty,
    cleanup: [
      {
        id: "cleanup",
        roomId: "room",
        operationId: "operation",
        characterId: "scvm",
        tokenId: "token",
        generation: "old",
      },
    ],
  };
  vi.mocked(fetchRoomParticipation).mockResolvedValue(pending);
  vi.mocked(finishSceneCleanup).mockResolvedValue(false);
  const { result } = roster();
  await waitFor(() => expect(result.current.cleanupPending).toBe(true));
  await waitFor(() => expect(finishSceneCleanup).toHaveBeenCalled());
  vi.mocked(finishSceneCleanup).mockResolvedValue(true);
  await act(async () => result.current.retrySceneCleanup());
  expect(removeRoomCharacter).not.toHaveBeenCalled();
  expect(finishSceneCleanup).toHaveBeenLastCalledWith("room", pending);
});

it("keeps cleanup available when an external scene update fails after the server removal", async () => {
  const pending: RoomParticipation = {
    ...empty,
    cleanup: [
      {
        id: "cleanup",
        roomId: "room",
        operationId: "operation",
        characterId: "scvm",
        tokenId: "token",
        generation: "old",
      },
    ],
  };
  vi.mocked(fetchRoomParticipation).mockResolvedValue(pending);
  vi.mocked(removeRoomCharacter).mockResolvedValue(pending);
  vi.mocked(finishSceneCleanup).mockRejectedValue(
    new Error("scene unavailable"),
  );
  const { result } = roster();
  await act(async () => result.current.removeFromRoster("scvm"));
  expect(result.current.removeRosterAction?.error).toBe("scene unavailable");
  expect(result.current.cleanupPending).toBe(true);
  expect(removeRoomCharacter).toHaveBeenCalledTimes(1);
});
