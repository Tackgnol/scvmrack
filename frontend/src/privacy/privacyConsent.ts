import { useSyncExternalStore } from 'react';
import { getPrivacySettings } from '@/privacy/privacySettings';

type Listener = () => void;

const listeners = new Set<Listener>();

const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = (): boolean => getPrivacySettings().acknowledged;

// Server/non-browser render: treat consent as not yet given so nothing
// storage-dependent (e.g. guest character creation) runs before hydration.
const getServerSnapshot = (): boolean => false;

/**
 * Notify subscribers that privacy consent state changed (e.g. the storage
 * notice was just acknowledged). Storage writes alone aren't observable, so the
 * drawer calls this after persisting so gated flows can react immediately.
 */
export const notifyPrivacyConsentChanged = (): void => {
    listeners.forEach((listener) => listener());
};

/**
 * Reactively tracks whether the storage/privacy notice has been acknowledged.
 * Used to gate first-run guest character creation until the user has accepted
 * the notice, so essential backend/local storage no longer precedes consent.
 */
export const usePrivacyAcknowledged = (): boolean =>
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
