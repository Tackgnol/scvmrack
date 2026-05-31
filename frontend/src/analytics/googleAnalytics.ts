import type { AnalyticsInstance } from 'analytics';
import { getRuntimeDocumentTitle, isBrowserRuntime } from '@/platform/runtime';
import { getPrivacySettings, isAnalyticsAllowed } from '@/privacy/privacySettings';

let analyticsInstance: AnalyticsInstance | null = null;
let analyticsInitPromise: Promise<AnalyticsInstance | null> | null = null;
let analyticsConsentGranted = false;

const getGaMeasurementId = (): string | undefined => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
    return measurementId ? measurementId : undefined;
};

const applyGaDisableFlag = (disabled: boolean): void => {
    if (!isBrowserRuntime()) {
        return;
    }

    const measurementId = getGaMeasurementId();
    if (!measurementId) {
        return;
    }

    const disableFlag = `ga-disable-${measurementId}`;
    (window as unknown as Record<string, boolean>)[disableFlag] = disabled;
};

export const setAnalyticsEnabled = (enabled: boolean): void => {
    const wasEnabled = analyticsConsentGranted;
    analyticsConsentGranted = enabled;
    applyGaDisableFlag(!enabled);

    if (!enabled) {
        analyticsInstance = null;
        analyticsInitPromise = null;
        return;
    }

    initGoogleAnalytics();

    if (!wasEnabled && isBrowserRuntime()) {
        const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        trackPageView({
            path,
            title: getRuntimeDocumentTitle(),
            url: window.location.href,
            search: window.location.search || undefined,
        });
    }
};

export const initializeAnalyticsConsent = (): void => {
    const privacySettings = getPrivacySettings();
    setAnalyticsEnabled(isAnalyticsAllowed(privacySettings));
};

const loadGoogleAnalytics = async (): Promise<AnalyticsInstance | null> => {
    if (!analyticsConsentGranted || !isBrowserRuntime()) {
        return null;
    }

    if (analyticsInstance) {
        return analyticsInstance;
    }

    if (analyticsInitPromise) {
        return analyticsInitPromise;
    }

    const measurementId = getGaMeasurementId();
    if (!measurementId) {
        return null;
    }

    analyticsInitPromise = Promise.all([
        import('analytics'),
        import('@analytics/google-analytics'),
    ]).then(([analyticsModule, googleAnalyticsModule]) => {
        if (!analyticsConsentGranted) {
            return null;
        }

        analyticsInstance = analyticsModule.default({
            app: 'scvm-rack',
            plugins: [
                googleAnalyticsModule.default({
                    measurementIds: [measurementId],
                    gtagConfig: {
                        send_page_view: false,
                        anonymize_ip: true,
                    },
                }),
            ],
        });

        return analyticsInstance;
    }).catch(() => {
        analyticsInitPromise = null;
        return null;
    });

    return analyticsInitPromise;
};

export const initGoogleAnalytics = (): void => {
    void loadGoogleAnalytics();
};

interface PageViewPayload {
    path: string;
    title?: string;
    url?: string;
    search?: string;
}

export const trackPageView = ({ path, title, url, search }: PageViewPayload): void => {
    if (!analyticsConsentGranted || !isBrowserRuntime()) return;

    void loadGoogleAnalytics().then((instance) => {
        if (!analyticsConsentGranted || !instance) return;

        void instance.page({
            path,
            title: title ?? getRuntimeDocumentTitle(),
            url,
            search,
        });
    });
};

export const trackEvent = (
    eventName: string,
    params?: Record<string, string | number | boolean | null | undefined>
): void => {
    if (!analyticsConsentGranted) return;

    void loadGoogleAnalytics().then((instance) => {
        if (!analyticsConsentGranted || !instance) return;

        void instance.track(eventName, params ?? {});
    });
};
