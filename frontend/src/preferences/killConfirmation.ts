import { isBrowserRuntime } from '@/platform/runtime';

// Whether the user opted out of the "Kill this scvm?" confirmation via the
// "Don't show this again" checkbox. Stored as a simple flag; clearing it (or
// losing storage) just brings the confirmation back, which is the safe default.
const SKIP_KILL_CONFIRM_STORAGE_KEY = 'scvmrack-skip-kill-confirm-v1';

export const shouldSkipKillConfirm = (): boolean => {
    if (!isBrowserRuntime()) {
        return false;
    }

    try {
        return localStorage.getItem(SKIP_KILL_CONFIRM_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const setSkipKillConfirm = (skip: boolean): void => {
    if (!isBrowserRuntime()) {
        return;
    }

    try {
        if (skip) {
            localStorage.setItem(SKIP_KILL_CONFIRM_STORAGE_KEY, 'true');
        } else {
            localStorage.removeItem(SKIP_KILL_CONFIRM_STORAGE_KEY);
        }
    } catch {
        // Ignore storage errors; the confirmation simply keeps showing.
    }
};
