import { beforeEach, describe, expect, it, vi } from "vitest";

type Role = "GM" | "PLAYER";

const sdk = vi.hoisted(() => {
  const state = {
    ready: true,
    readyCallbacks: [] as Array<() => void>,
    roleChange: null as null | ((player: { role: Role }) => void),
    broadcast: null as null | ((event: { data: unknown }) => void),
  };
  const unsubscribeRoleChange = vi.fn();
  return {
    state,
    unsubscribeRoleChange,
    obr: {
      isAvailable: true,
      onReady: vi.fn((callback: () => void) => {
        if (state.ready) {
          callback();
        } else {
          state.readyCallbacks.push(callback);
        }
      }),
      room: { id: "room-1" },
      player: {
        getRole: vi.fn<() => Promise<Role>>(() => Promise.resolve("PLAYER")),
        onChange: vi.fn((callback: (player: { role: Role }) => void) => {
          state.roleChange = callback;
          return unsubscribeRoleChange;
        }),
        select: vi.fn(() => Promise.resolve()),
      },
      notification: { show: vi.fn(() => Promise.resolve("notification-1")) },
      broadcast: {
        onMessage: vi.fn(
          (_channel: string, callback: (event: { data: unknown }) => void) => {
            state.broadcast = callback;
            return vi.fn();
          },
        ),
      },
    },
  };
});

vi.mock("@owlbear-rodeo/sdk", () => ({ default: sdk.obr }));

import { sdkOwlbear } from "@/obr/owlbear";

function becomeReady() {
  sdk.state.ready = true;
  for (const callback of sdk.state.readyCallbacks.splice(0)) {
    callback();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  sdk.state.ready = true;
  sdk.state.readyCallbacks = [];
  sdk.state.roleChange = null;
  sdk.state.broadcast = null;
  sdk.obr.isAvailable = true;
  sdk.obr.room.id = "room-1";
});

describe("sdkOwlbear.whenReady", () => {
  it("starts once Owlbear is ready and stops what the start returned", () => {
    sdk.state.ready = false;
    const cleanup = vi.fn();
    const start = vi.fn((_isActive: () => boolean) => cleanup);

    const stop = sdkOwlbear.whenReady(start);
    expect(start).not.toHaveBeenCalled();

    becomeReady();
    expect(start).toHaveBeenCalledOnce();
    const isActive = start.mock.calls[0][0];
    expect(isActive()).toBe(true);

    stop();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(isActive()).toBe(false);
  });

  it("never starts when stopped before Owlbear is ready", () => {
    sdk.state.ready = false;
    const start = vi.fn();

    sdkOwlbear.whenReady(start)();
    becomeReady();

    expect(start).not.toHaveBeenCalled();
  });
});

describe("sdkOwlbear.watchRole", () => {
  it("reads the role once after ready, then follows player changes", async () => {
    sdk.obr.player.getRole.mockResolvedValue("GM");
    const listener = vi.fn();

    const stop = sdkOwlbear.watchRole(listener);

    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith("GM"));
    expect(sdk.obr.player.getRole).toHaveBeenCalledOnce();
    expect(sdk.obr.player.onChange).toHaveBeenCalledOnce();

    sdk.state.roleChange?.({ role: "PLAYER" });
    expect(listener).toHaveBeenLastCalledWith("PLAYER");

    stop();
    expect(sdk.unsubscribeRoleChange).toHaveBeenCalledOnce();
  });

  it("does not report or subscribe when stopped while the role is loading", async () => {
    let resolveRole: (role: Role) => void = () => {};
    sdk.obr.player.getRole.mockReturnValue(
      new Promise<Role>((resolve) => {
        resolveRole = resolve;
      }),
    );
    const listener = vi.fn();

    const stop = sdkOwlbear.watchRole(listener);
    stop();
    resolveRole("GM");
    await Promise.resolve();
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
    expect(sdk.obr.player.onChange).not.toHaveBeenCalled();
  });
});

describe("sdkOwlbear", () => {
  it("reads availability and the room id when asked, not at import", () => {
    sdk.obr.isAvailable = false;
    sdk.obr.room.id = "room-2";

    expect(sdkOwlbear.isAvailable).toBe(false);
    expect(sdkOwlbear.roomId()).toBe("room-2");
  });

  it("forwards notifications, token selection and broadcast payloads", async () => {
    const listener = vi.fn();

    await sdkOwlbear.notify("Bound", "SUCCESS");
    await sdkOwlbear.selectTokens(["token-1"]);
    sdkOwlbear.onBroadcast("channel", listener);
    sdk.state.broadcast?.({ data: { kind: "roster" } });

    expect(sdk.obr.notification.show).toHaveBeenCalledWith("Bound", "SUCCESS");
    expect(sdk.obr.player.select).toHaveBeenCalledWith(["token-1"], true);
    expect(sdk.obr.broadcast.onMessage).toHaveBeenCalledWith(
      "channel",
      expect.any(Function),
    );
    expect(listener).toHaveBeenCalledWith({ kind: "roster" });
  });
});
