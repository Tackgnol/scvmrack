import { render, waitFor } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import UnitTestProvider from '../../UnitTestProvider';

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

        render(
            <UnitTestProvider>
                <AnalyticsPageTracker />
            </UnitTestProvider>
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

        render(
            <UnitTestProvider>
                <AnalyticsPageTracker />
            </UnitTestProvider>
        );

        await waitFor(() => expect(vi.mocked(trackPageView)).toHaveBeenCalledWith({
            path: '/characters/char-123?tab=inventory#details',
            title: 'Test Character Sheet',
            url: expect.stringContaining('/characters/char-123'),
            search: '?tab=inventory',
        }));
    });

    it('does not track duplicate path changes (strict mode double-render)', async () => {
        const mockLocation = {
            pathname: '/characters',
            searchStr: '',
            hash: '',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        render(
            <UnitTestProvider>
                <AnalyticsPageTracker />
            </UnitTestProvider>
        );

        // trackPageView should only be called once even if effect runs twice (React StrictMode)
        // The component has a ref check to prevent duplicate tracking
        await waitFor(() => expect(vi.mocked(trackPageView).mock.calls.length).toBe(1));
    });

    it('handles location with no search string', async () => {
        const mockLocation = {
            pathname: '/',
            searchStr: '',
            hash: '',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        render(
            <UnitTestProvider>
                <AnalyticsPageTracker />
            </UnitTestProvider>
        );

        await waitFor(() => expect(vi.mocked(trackPageView)).toHaveBeenCalledWith(
            expect.objectContaining({
                path: '/',
            })
        ));
    });

    it('handles location with hash', async () => {
        const mockLocation = {
            pathname: '/characters',
            searchStr: '',
            hash: '#equipment',
        };

        vi.mocked(useRouterState).mockReturnValue(mockLocation as any);

        render(
            <UnitTestProvider>
                <AnalyticsPageTracker />
            </UnitTestProvider>
        );

        await waitFor(() => expect(vi.mocked(trackPageView)).toHaveBeenCalledWith(
            expect.objectContaining({
                path: '/characters#equipment',
            })
        ));
    });
});
