import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useQueryClient } from "@tanstack/react-query";
import {
  partyDetailQueryKey,
  partyMemberDetailQueryKey,
  partyRosterQueryKey,
  usePartyStream,
} from "../../../src/hooks/usePartyStream.ts";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: vi.fn(),
  };
});

type StreamCall = {
  url: string;
  options: any;
};

const calls: StreamCall[] = [];

// Mock fetch-event-source: capture the options so tests can drive the
// onopen/onmessage/onerror callbacks directly, the way the server would.
vi.mock("@microsoft/fetch-event-source", () => ({
  EventStreamContentType: "text/event-stream",
  fetchEventSource: vi.fn((url: string, options: any) => {
    calls.push({ url, options });
    return new Promise<void>(() => {
      /* never resolves — mirrors a live stream */
    });
  }),
}));

const okResponse = {
  ok: true,
  status: 200,
  headers: { get: () => "text/event-stream" },
} as unknown as Response;

const emit = (event: string, data: unknown) =>
  calls[0].options.onmessage({
    event,
    data: typeof data === "string" ? data : JSON.stringify(data),
  });

beforeEach(() => {
  calls.length = 0;
  (useQueryClient as any).mockReturnValue({ invalidateQueries: vi.fn() });
});

test("does not connect when disabled", () => {
  const { result } = renderHook(() =>
    usePartyStream("party-1", { enabled: false }),
  );

  expect(result.current.status).toBe("idle");
  expect(calls).toHaveLength(0);
});

test("connects with credentials and aborts on unmount", async () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { unmount } = renderHook(() => usePartyStream("party-1"));

  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe("http://localhost:3000/api/parties/party-1/stream");
  expect(calls[0].options.credentials).toBe("include");
  expect(calls[0].options.signal.aborted).toBe(false);

  await act(async () => {
    await calls[0].options.onopen(okResponse);
  });

  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: partyRosterQueryKey(),
  });
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: partyDetailQueryKey("party-1"),
  });

  unmount();
  expect(calls[0].options.signal.aborted).toBe(true);
});

test("does not reconnect when option callbacks are recreated by rerenders", async () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { rerender } = renderHook(() =>
    usePartyStream("party-1", { onClosed: () => {} }),
  );

  expect(calls).toHaveLength(1);

  rerender();
  expect(calls).toHaveLength(1);

  await act(async () => {
    await calls[0].options.onopen(okResponse);
  });

  expect(calls).toHaveLength(1);
});

test("character.updated invalidates that member and stores changed fields", () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() => usePartyStream("party-1"));

  act(() => {
    emit("character.updated", {
      type: "character.updated",
      characterId: "char-1",
      fields: ["currentHp", "name"],
    });
  });

  expect(result.current.changedFieldsByCharacter["char-1"]).toEqual([
    "currentHp",
    "name",
  ]);
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: partyMemberDetailQueryKey("char-1"),
  });
});

test("membership events invalidate roster and changed member detail", () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  renderHook(() => usePartyStream("party-1"));

  act(() => {
    emit("character.joined", {
      type: "character.joined",
      characterId: "char-1",
    });
  });

  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: partyRosterQueryKey(),
  });
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: partyDetailQueryKey("party-1"),
  });
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: partyMemberDetailQueryKey("char-1"),
  });
});

test("presence snapshot and presence events update connection state", () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() => usePartyStream("party-1"));

  act(() => {
    emit("party.presenceSnapshot", {
      type: "party.presenceSnapshot",
      presence: { "char-1": true, "char-2": false },
    });
  });

  expect(result.current.presenceByCharacter).toEqual({
    "char-1": true,
    "char-2": false,
  });

  act(() => {
    emit("character.presence", {
      type: "character.presence",
      characterId: "char-1",
      connected: false,
    });
  });

  expect(result.current.presenceByCharacter).toEqual({
    "char-1": false,
    "char-2": false,
  });
  expect(queryClient.invalidateQueries).not.toHaveBeenCalledWith({
    queryKey: partyMemberDetailQueryKey("char-1"),
  });
});

test("presence state clears when the stream is disabled", () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result, rerender } = renderHook(
    ({ enabled }) => usePartyStream("party-1", { enabled }),
    { initialProps: { enabled: true } },
  );

  act(() => {
    emit("party.presenceSnapshot", {
      type: "party.presenceSnapshot",
      presence: { "char-1": true },
    });
  });
  expect(result.current.presenceByCharacter).toEqual({ "char-1": true });

  rerender({ enabled: false });

  expect(result.current.status).toBe("idle");
  expect(result.current.presenceByCharacter).toEqual({});
});

test("party.closed closes the stream and calls onClosed", () => {
  const onClosed = vi.fn();
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() => usePartyStream("party-1", { onClosed }));

  act(() => {
    emit("party.closed", { type: "party.closed" });
  });

  expect(result.current.status).toBe("closed");
  expect(calls[0].options.signal.aborted).toBe(true);
  expect(onClosed).toHaveBeenCalledTimes(1);
});

test("malformed events are ignored without throwing", () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() => usePartyStream("party-1"));

  expect(() => {
    act(() => {
      emit("character.updated", "{not-json");
    });
  }).not.toThrow();

  expect(result.current.changedFieldsByCharacter).toEqual({});
  expect(queryClient.invalidateQueries).not.toHaveBeenCalledWith({
    queryKey: partyMemberDetailQueryKey("char-1"),
  });
});

test("fatal open response stops without retrying", async () => {
  const queryClient = { invalidateQueries: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() => usePartyStream("party-1"));

  const forbidden = {
    ok: false,
    status: 403,
    headers: { get: () => "application/json" },
  } as unknown as Response;

  let thrown: unknown;
  await act(async () => {
    await calls[0].options.onopen(forbidden).catch((err: unknown) => {
      thrown = err;
    });
  });
  expect(thrown).toBeInstanceOf(Error);

  // onerror re-throws the fatal error (so the library stops reconnecting).
  act(() => {
    expect(() => calls[0].options.onerror(thrown)).toThrow();
  });
  expect(result.current.status).toBe("closed");
});
