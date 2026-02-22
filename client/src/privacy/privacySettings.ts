import { isBrowserRuntime } from '@/platform/runtime';

export interface PrivacySettings {
    acknowledged: boolean;
    analyticsEnabled: boolean;
}

const PRIVACY_SETTINGS_STORAGE_KEY = 'scvmgrinder-privacy-settings-v1';

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
    acknowledged: false,
    analyticsEnabled: true,
};

const isPrivacySettings = (value: unknown): value is PrivacySettings => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.acknowledged === 'boolean' &&
        typeof candidate.analyticsEnabled === 'boolean'
    );
};

export const getDefaultPrivacySettings = (): PrivacySettings => {
    return { ...DEFAULT_PRIVACY_SETTINGS };
};

export const getPrivacySettings = (): PrivacySettings => {
    if (!isBrowserRuntime()) {
        return getDefaultPrivacySettings();
    }

    try {
        const raw = localStorage.getItem(PRIVACY_SETTINGS_STORAGE_KEY);
        if (!raw) {
            return getDefaultPrivacySettings();
        }

        const parsed = JSON.parse(raw);
        if (isPrivacySettings(parsed)) {
            return parsed;
        }
    } catch {
        // Fall back to defaults when storage is unavailable or malformed.
    }

    return getDefaultPrivacySettings();
};

export const savePrivacySettings = (settings: PrivacySettings): void => {
    if (!isBrowserRuntime()) {
        return;
    }

    try {
        localStorage.setItem(PRIVACY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors; app should continue to function.
    }
};

export const isAnalyticsAllowed = (settings: PrivacySettings): boolean => {
    return settings.acknowledged && settings.analyticsEnabled;
};
