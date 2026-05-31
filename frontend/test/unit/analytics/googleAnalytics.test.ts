import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST');

const mockTrack = vi.fn();
const mockPage = vi.fn();

vi.mock('analytics', () => ({
    default: vi.fn(() => ({
        track: mockTrack,
        page: mockPage,
    })),
}));

vi.mock('@analytics/google-analytics', () => ({
    default: vi.fn(),
}));

vi.mock('@/platform/runtime', () => ({
    getRuntimeDocumentTitle: vi.fn(() => 'Test Title'),
    getRuntimeOrigin: vi.fn(() => 'https://example.com'),
    isBrowserRuntime: vi.fn(() => true),
}));

vi.mock('@/privacy/privacySettings', () => ({
    getPrivacySettings: vi.fn(() => ({ acknowledged: true, analyticsEnabled: true })),
    isAnalyticsAllowed: vi.fn(() => true),
}));

import {
    trackEvent,
    trackPageView,
    setAnalyticsEnabled,
    initializeAnalyticsConsent,
} from '@/analytics/googleAnalytics';

describe('googleAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Reset to disabled state after each test
        setAnalyticsEnabled(false);
        vi.useRealTimers();
    });

    describe('setAnalyticsEnabled', () => {
        it('enables analytics when setAnalyticsEnabled(true) is called', async () => {
            setAnalyticsEnabled(true);

            // When enabled, trackEvent should actually call the analytics track
            trackEvent('test_event', { key: 'value' });
            await vi.waitFor(() => {
                expect(mockTrack).toHaveBeenCalledWith('test_event', { key: 'value' });
            });
        });

        it('disables analytics when setAnalyticsEnabled(false) is called', () => {
            setAnalyticsEnabled(true);
            setAnalyticsEnabled(false);

            // After disabling, trackEvent should not call analytics
            mockTrack.mockClear();
            trackEvent('test_event', { key: 'value' });
            expect(mockTrack).not.toHaveBeenCalled();
        });
    });

    describe('initializeAnalyticsConsent', () => {
        it('enables analytics when privacy settings allow it', async () => {
            initializeAnalyticsConsent();

            // With privacy settings returning analyticsEnabled: true, it should be enabled
            trackEvent('consent_test');
            await vi.waitFor(() => {
                expect(mockTrack).toHaveBeenCalled();
            });
        });
    });

    describe('trackPageView', () => {
        it('tracks page view with path and title when enabled', async () => {
            vi.useFakeTimers();
            setAnalyticsEnabled(true);

            trackPageView({
                path: '/characters',
                title: 'My Characters',
            });

            await vi.advanceTimersByTimeAsync(8000);

            await vi.waitFor(() => {
                expect(mockPage).toHaveBeenCalledWith({
                    path: '/characters',
                    title: 'My Characters',
                    url: undefined,
                    search: undefined,
                });
            });
        });

        it('tracks page view with full url when origin is available', async () => {
            vi.useFakeTimers();
            setAnalyticsEnabled(true);

            trackPageView({
                path: '/characters/123',
                url: 'https://example.com/characters/123',
                search: '?tab=inventory',
            });

            await vi.advanceTimersByTimeAsync(8000);

            await vi.waitFor(() => {
                expect(mockPage).toHaveBeenCalledWith({
                    path: '/characters/123',
                    title: 'Test Title',
                    url: 'https://example.com/characters/123',
                    search: '?tab=inventory',
                });
            });
        });

        it('does not track page view when analytics is disabled', () => {
            setAnalyticsEnabled(false);

            trackPageView({ path: '/test' });
            expect(mockPage).not.toHaveBeenCalled();
        });

        it('uses getRuntimeDocumentTitle as fallback when title is not provided', async () => {
            vi.useFakeTimers();
            setAnalyticsEnabled(true);

            trackPageView({ path: '/test' });

            await vi.advanceTimersByTimeAsync(8000);

            await vi.waitFor(() => {
                expect(mockPage).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Test Title',
                    })
                );
            });
        });
    });

    describe('trackEvent', () => {
        it('tracks event with name only', async () => {
            setAnalyticsEnabled(true);

            trackEvent('test_event');

            await vi.waitFor(() => {
                expect(mockTrack).toHaveBeenCalledWith('test_event', {});
            });
        });

        it('tracks event with parameters', async () => {
            setAnalyticsEnabled(true);

            trackEvent('character_edited', {
                fields: 'currentHp',
                patch_count: 1,
                locale: 'en',
            });

            await vi.waitFor(() => {
                expect(mockTrack).toHaveBeenCalledWith('character_edited', {
                    fields: 'currentHp',
                    patch_count: 1,
                    locale: 'en',
                });
            });
        });

        it('handles null and undefined parameters gracefully', () => {
            setAnalyticsEnabled(true);

            expect(() => {
                trackEvent('test', { key: null, other: undefined });
            }).not.toThrow();
        });

        it('does not track event when analytics is disabled', () => {
            setAnalyticsEnabled(false);

            trackEvent('test_event', { key: 'value' });
            expect(mockTrack).not.toHaveBeenCalled();
        });
    });
});
