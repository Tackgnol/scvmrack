declare module '@analytics/google-analytics' {
    import type { AnalyticsPlugin } from 'analytics';

    export interface GoogleAnalyticsGtagConfig {
        anonymize_ip?: boolean;
        send_page_view?: boolean;
        cookie_domain?: unknown;
        cookie_expires?: unknown;
        cookie_prefix?: unknown;
        cookie_update?: unknown;
        cookie_flags?: unknown;
        [key: string]: unknown;
    }

    export interface GoogleAnalyticsPluginConfig {
        measurementIds: string[];
        debug?: boolean;
        dataLayerName?: string;
        gtagName?: string;
        gtagConfig?: GoogleAnalyticsGtagConfig;
        customScriptSrc?: string;
        nonce?: string;
        [key: string]: unknown;
    }

    export default function googleAnalytics(
        config: GoogleAnalyticsPluginConfig
    ): AnalyticsPlugin<'google-analytics'>;
}
