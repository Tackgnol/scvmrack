import type {
  ObrNotificationVariant,
  ObrRole,
  Owlbear,
  Unsubscribe,
} from "@/obr/owlbear.models";

export type MemoryOwlbearOptions = {
  isAvailable?: boolean;
  ready?: boolean;
  roomId?: string;
  playerId?: string;
  role?: ObrRole;
  selection?: string[];
};

export type MemoryNotification = {
  message: string;
  variant: ObrNotificationVariant;
};

/** An in-memory Owlbear for tests: configure it up front, drive it, then read what the app asked of it. */
export type MemoryOwlbear = Owlbear & {
  isAvailable: boolean;
  /** Current token selection; `selectTokens` replaces it. */
  selection: string[];
  readonly notifications: MemoryNotification[];
  readonly panelWidths: number[];
  readonly panelHeights: number[];
  readonly closedPopovers: string[];
  /** Makes Owlbear ready and runs every `whenReady` start still waiting. */
  becomeReady(): void;
  /** Changes the player's role and reports it to every `watchRole` listener. */
  setRole(role: ObrRole): void;
  setRoomId(roomId: string): void;
  /** Delivers `data` to every `onBroadcast` listener on `channel`. */
  emitBroadcast(channel: string, data: unknown): void;
};

/** Builds an in-memory Owlbear: ready, available, a PLAYER in "room-test" unless `options` say otherwise. */
export function createMemoryOwlbear(
  options: MemoryOwlbearOptions = {},
): MemoryOwlbear {
  let ready = options.ready ?? true;
  let roomId = options.roomId ?? "room-test";
  let role: ObrRole = options.role ?? "PLAYER";
  const playerId = options.playerId ?? "player-1";
  const waitingForReady = new Set<() => void>();
  const roleListeners = new Set<(role: ObrRole) => void>();
  const broadcastListeners = new Map<string, Set<(data: unknown) => void>>();

  function whenReady(
    start: (isActive: () => boolean) => Unsubscribe | void,
  ): Unsubscribe {
    let active = true;
    let stop: Unsubscribe | void;
    const run = () => {
      waitingForReady.delete(run);
      if (active) {
        stop = start(() => active);
      }
    };
    if (ready) {
      run();
    } else {
      waitingForReady.add(run);
    }
    return () => {
      active = false;
      waitingForReady.delete(run);
      stop?.();
    };
  }

  const owlbear: MemoryOwlbear = {
    isAvailable: options.isAvailable ?? true,
    selection: [...(options.selection ?? [])],
    notifications: [],
    panelWidths: [],
    panelHeights: [],
    closedPopovers: [],
    whenReady,
    roomId: () => roomId,
    playerId: () => Promise.resolve(playerId),
    role: () => Promise.resolve(role),
    watchRole(listener) {
      const report = (nextRole: ObrRole) => listener(nextRole);
      const stopWaiting = whenReady((isActive) => {
        // Reported on a later tick, like the SDK's role lookup.
        queueMicrotask(() => {
          if (isActive()) {
            report(role);
            roleListeners.add(report);
          }
        });
      });
      return () => {
        stopWaiting();
        roleListeners.delete(report);
      };
    },
    selectTokens(tokenIds) {
      owlbear.selection = [...tokenIds];
      return Promise.resolve();
    },
    notify(message, variant) {
      owlbear.notifications.push({ message, variant });
      return Promise.resolve();
    },
    setPanelWidth(width) {
      owlbear.panelWidths.push(width);
      return Promise.resolve();
    },
    setPanelHeight(height) {
      owlbear.panelHeights.push(height);
      return Promise.resolve();
    },
    closePopover(popoverId) {
      owlbear.closedPopovers.push(popoverId);
      return Promise.resolve();
    },
    onBroadcast(channel, listener) {
      const deliver = (data: unknown) => listener(data);
      const listeners = broadcastListeners.get(channel) ?? new Set();
      listeners.add(deliver);
      broadcastListeners.set(channel, listeners);
      return () => {
        listeners.delete(deliver);
      };
    },
    becomeReady() {
      ready = true;
      for (const run of [...waitingForReady]) {
        run();
      }
    },
    setRole(nextRole) {
      role = nextRole;
      for (const listener of [...roleListeners]) {
        listener(nextRole);
      }
    },
    setRoomId(nextRoomId) {
      roomId = nextRoomId;
    },
    emitBroadcast(channel, data) {
      for (const listener of [...(broadcastListeners.get(channel) ?? [])]) {
        listener(data);
      }
    },
  };

  return owlbear;
}
