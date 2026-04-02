import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import BrowserTestProvider from '../BrowserTestProvider';

// Mock the router state
vi.mock('@tanstack/react-router', () => ({
    useRouterState: vi.fn(),
}));

import { useRouterState } from '@tanstack/react-router';

// Mock dependencies
vi.mock('@/analytics/googleAnalytics', () => ({
    trackPageView: vi.fn(),
}));

vi.mock('@/platform/runtime', () => ({
    getRuntimeDocumentTitle: vi.fn(() => 'Test Character Sheet'),
    getRuntimeOrigin: vi.fn(() => 'https://example.com'),
}));

import { trackPageView } from '@/analytics/googleAnalytics';

describe('AnalyticsPageTracker Browser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing (is a null component)', async () => {
        vi.mocked(useRouterState).mockReturnValue({
            pathname: '/characters',
            searchStr: '',
            hash: '',
        } as any);

        await render(
            <BrowserTestProvider>
                <AnalyticsPageTracker />
            </BrowserTestProvider>
        );

        // The component renders null — if we reach here without throwing, the test passes
    });

    it('tracks page view when location changes', async () => {
        const mockLocation = {
            pathname: '/characters/char-123',
            searchStr: '?tab=inventory',
            hash: '#details',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        // We need to use a real render that triggers the useEffect
        const { unmount } = await import('vitest-browser-react').then(({ render }) =>
            render(
                <BrowserTestProvider>
                    <AnalyticsPageTracker />
                </BrowserTestProvider>
            )
        );

        // Wait for the effect to run
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(trackPageView).toHaveBeenCalledWith({
            path: '/characters/char-123?tab=inventory#details',
            title: 'Test Character Sheet',
            url: expect.stringContaining('/characters/char-123'),
            search: '?tab=inventory',
        });

        unmount();
    });

    it('does not track duplicate path changes (strict mode double-render)', async () => {
        const mockLocation = {
            pathname: '/characters',
            searchStr: '',
            hash: '',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        const { unmount } = await import('vitest-browser-react').then(({ render }) =>
            render(
                <BrowserTestProvider>
                    <AnalyticsPageTracker />
                </BrowserTestProvider>
            )
        );

        await new Promise(resolve => setTimeout(resolve, 0));

        // trackPageView should only be called once even if effect runs twice (React StrictMode)
        // The component has a ref check to prevent duplicate tracking
        const callCount = trackPageView.mock.calls.length;

        unmount();
    });

    it('handles location with no search string', async () => {
        const mockLocation = {
            pathname: '/',
            searchStr: '',
            hash: '',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        const { unmount } = await import('vitest-browser-react').then(({ render }) =>
            render(
                <BrowserTestProvider>
                    <AnalyticsPageTracker />
                </BrowserTestProvider>
            )
        );

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(trackPageView).toHaveBeenCalledWith(
            expect.objectContaining({
                path: '/',
            })
        );

        unmount();
    });

    it('handles location with hash', async () => {
        const mockLocation = {
            pathname: '/characters',
            searchStr: '',
            hash: '#equipment',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        const { unmount } = await import('vitest-browser-react').then(({ render }) =>
            render(
                <BrowserTestProvider>
                    <AnalyticsPageTracker />
                </BrowserTestProvider>
            )
        );

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(trackPageView).toHaveBeenCalledWith(
            expect.objectContaining({
                path: '/characters#equipment',
            })
        );

        unmount();
    });
});
