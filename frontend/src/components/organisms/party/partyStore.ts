import { useSyncExternalStore } from 'react';

// Module-level open/close state for the party takeover. Lives outside React (the
// same pattern as the just-created handoff in useCurrentCharacter) so any trigger
// — the header pill, the mobile dock, the edge pull-tab — can open the drawer
// without threading callbacks through the whole header tree.
let open = false;
const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const openParty = (): void => {
  if (open) return;
  open = true;
  emit();
};

export const closeParty = (): void => {
  if (!open) return;
  open = false;
  emit();
};

const subscribe = (onStoreChange: () => void): (() => void) => {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
};

const getSnapshot = (): boolean => open;

export function useIsPartyOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
