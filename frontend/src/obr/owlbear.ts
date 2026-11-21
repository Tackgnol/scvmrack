import OBR from "@owlbear-rodeo/sdk";
import { useContext } from "react";
import type {
  ObrNotificationVariant,
  Owlbear,
  Unsubscribe,
} from "./owlbear.models";
import { OwlbearContext } from "./OwlbearContext";

function whenReady(
  start: (isActive: () => boolean) => Unsubscribe | void,
): Unsubscribe {
  let active = true;
  let stop: Unsubscribe | void;
  OBR.onReady(() => {
    if (active) {
      stop = start(() => active);
    }
  });
  return () => {
    active = false;
    stop?.();
  };
}

/**
 * The app's Owlbear backed by the real SDK. Modules that hand the SDK to the
 * rpgtools package helpers or read scene items stay SDK-bound and use this
 * directly; components and app hooks go through `useOwlbear()`.
 */
export const sdkOwlbear: Owlbear = {
  get isAvailable() {
    return OBR.isAvailable;
  },
  whenReady,
  roomId: () => OBR.room.id,
  playerId: () => OBR.player.getId(),
  role: () => OBR.player.getRole(),
  watchRole(listener) {
    let stopRoleChanges: Unsubscribe | null = null;
    const stopWaiting = whenReady((isActive) => {
      void OBR.player.getRole().then((role) => {
        if (!isActive()) {
          return;
        }
        listener(role);
        stopRoleChanges = OBR.player.onChange((player) => {
          listener(player.role);
        });
      });
    });
    return () => {
      stopWaiting();
      stopRoleChanges?.();
    };
  },
  selectTokens: (tokenIds) => OBR.player.select(tokenIds, true),
  async notify(message, variant) {
    await OBR.notification.show(message, variant);
  },
  setPanelWidth: (width) => OBR.action.setWidth(width),
  setPanelHeight: (height) => OBR.action.setHeight(height),
  closePopover: (popoverId) => OBR.popover.close(popoverId),
  onBroadcast: (channel, listener) =>
    OBR.broadcast.onMessage(channel, (event) => {
      listener(event.data);
    }),
};

/** The Owlbear this part of the tree talks to: a test's in-memory one, else the SDK. */
export function useOwlbear(): Owlbear {
  return useContext(OwlbearContext) ?? sdkOwlbear;
}

/** Notifies without failing the caller; for feedback whose loss must not break the control. */
export async function notifyQuietly(
  owlbear: Owlbear,
  message: string,
  variant: ObrNotificationVariant,
): Promise<void> {
  try {
    await owlbear.notify(message, variant);
  } catch {
    // Owlbear dropped the notification; the action itself already settled.
  }
}
