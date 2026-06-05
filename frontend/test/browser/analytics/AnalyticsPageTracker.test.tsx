import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import BrowserTestProvider from '../BrowserTestProvider';

// Mock the router state
vi.mock('@tanstack/react-router', () => ({
    useRouterState: vi.fn(),
}));

import { useRouterState } from '@tanstack/react-router';

function mockRouterLocation(location: { pathname: string; searchStr: string; hash: string }) {
    vi.mocked(useRouterState).mockImplementation((opts: any) =>
        opts?.select ? opts.select({ location }) : location,
    );
}

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
        mockRouterLocation({ pathname: '/characters', searchStr: '', hash: '' });

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

        mockRouterLocation(mockLocation);

        await render(
            <BrowserTestProvider>
                <AnalyticsPageTracker />
            </BrowserTestProvider>
        );

        await expect.poll(() => vi.mocked(trackPageView)).toHaveBeenCalledWith({
            path: '/characters/char-123?tab=inventory#details',
            title: 'Test Character Sheet',
            url: expect.stringContaining('/characters/char-123'),
            search: '?tab=inventory',
        });
    });

    it('does not track duplicate path changes (strict mode double-render)', async () => {
        const mockLocation = {
            pathname: '/characters',
            searchStr: '',
            hash: '',
        };

        mockRouterLocation(mockLocation);

        await render(
            <BrowserTestProvider>
                <AnalyticsPageTracker />
            </BrowserTestProvider>
        );

        // trackPageView should only be called once even if effect runs twice (React StrictMode)
        // The component has a ref check to prevent duplicate tracking
        await expect.poll(() => vi.mocked(trackPageView).mock.calls.length).toBe(1);
    });

    it('handles location with no search string', async () => {
        const mockLocation = {
            pathname: '/',
            searchStr: '',
            hash: '',
        };

        mockRouterLocation(mockLocation);

        await render(
            <BrowserTestProvider>
                <AnalyticsPageTracker />
            </BrowserTestProvider>
        );

        await expect.poll(() => vi.mocked(trackPageView)).toHaveBeenCalledWith(
            expect.objectContaining({
                path: '/',
            })
        );
    });

    it('handles location with hash', async () => {
        const mockLocation = {
            pathname: '/characters',
            searchStr: '',
            hash: '#equipment',
        };

        mockRouterLocation(mockLocation);

        await render(
            <BrowserTestProvider>
                <AnalyticsPageTracker />
            </BrowserTestProvider>
        );

        await expect.poll(() => vi.mocked(trackPageView)).toHaveBeenCalledWith(
            expect.objectContaining({
                path: '/characters#equipment',
            })
        );
    });
});
