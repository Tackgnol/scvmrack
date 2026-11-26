import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { PrivacyNoticeDrawer } from '@/components/organisms/PrivacyNoticeDrawer';
import BrowserTestProvider from '../BrowserTestProvider';
import * as GoogleAnalyticsModule from '@/analytics/googleAnalytics';
import * as PrivacySettingsModule from '@/privacy/privacySettings';
import * as PrivacyDrawerBusModule from '@/privacy/privacyDrawerBus';

vi.mock('@/analytics/googleAnalytics', () => ({
    setAnalyticsEnabled: vi.fn(),
}));

const router = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('@tanstack/react-router', () => ({
    useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
        select({ location: { pathname: router.pathname } }),
    Link: ({ children, to, ...props }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={to} {...props}>{children}</a>
    ),
}));

vi.mock('@/privacy/privacySettings', () => ({
    getPrivacySettings: vi.fn(),
    isAnalyticsAllowed: vi.fn(),
    savePrivacySettings: vi.fn(),
}));

vi.mock('@/privacy/privacyDrawerBus', () => ({
    subscribeOpenPrivacyDrawer: vi.fn(),
}));

describe('PrivacyNoticeDrawer Component', () => {
    let mockSubscribeCallback: (() => void) | null = null;
    let mockGetSettings: any;

    beforeEach(() => {
        vi.clearAllMocks();
        router.pathname = '/';
        mockSubscribeCallback = null;

        mockGetSettings = vi.mocked(PrivacySettingsModule.getPrivacySettings);
        mockGetSettings.mockReturnValue({
            acknowledged: false,
            analyticsEnabled: true,
        });

        vi.mocked(PrivacySettingsModule.isAnalyticsAllowed).mockImplementation((settings) => settings.analyticsEnabled);

        vi.mocked(PrivacyDrawerBusModule.subscribeOpenPrivacyDrawer).mockImplementation((cb) => {
            mockSubscribeCallback = cb;
            return () => { mockSubscribeCallback = null; };
        });
    });

    it('renders on mount if not acknowledged', async () => {
        await render(
            <BrowserTestProvider>
                <PrivacyNoticeDrawer />
            </BrowserTestProvider>
        );

        // Should be open and show the privacy title
        // Should be open and show the privacy title
        // We evaluate visibility via the save button
        const saveBtn = page.getByTestId('privacy-drawer-save-button');
        await expect.element(saveBtn).toBeVisible();
        const privacyLink = page.getByRole('link', { name: 'Read the full privacy notice' });
        await expect.element(privacyLink).toBeVisible();
        await expect.element(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it.each(['/privacy', '/terms', '/legal'])(
        'stays out of the way on %s until the notice is acknowledged (RPG-286)',
        async (pathname) => {
            router.pathname = pathname;
            await render(
                <BrowserTestProvider>
                    <PrivacyNoticeDrawer />
                    <main>
                        <h1>Legal text</h1>
                    </main>
                </BrowserTestProvider>
            );

            await expect.element(page.getByRole('heading', { name: 'Legal text' })).toBeVisible();
            await expect.element(page.getByTestId('privacy-drawer-save-button')).not.toBeInTheDocument();
        }
    );

    it('does not render on mount if already acknowledged', async () => {
        mockGetSettings.mockReturnValue({
            acknowledged: true,
            analyticsEnabled: false,
        });

        await render(
            <BrowserTestProvider>
                <PrivacyNoticeDrawer />
            </BrowserTestProvider>
        );

        // Assert the drawer save button isn't in the DOM
        await expect.poll(() => page.getByTestId('privacy-drawer-save-button').all()).toHaveLength(0);
    });

    it('opens when the bus event fires', async () => {
        mockGetSettings.mockReturnValue({
            acknowledged: true,
            analyticsEnabled: false,
        });

        await render(
            <BrowserTestProvider>
                <PrivacyNoticeDrawer />
            </BrowserTestProvider>
        );

        // Initially closed
        await expect.poll(() => page.getByTestId('privacy-drawer-save-button').all()).toHaveLength(0);

        // Fire the event
        if (mockSubscribeCallback) {
            mockSubscribeCallback();
        }

        // Should be open now
        const saveBtn = page.getByTestId('privacy-drawer-save-button');
        await expect.element(saveBtn).toBeVisible();
    });

    it('saves preferences and disables analytics when toggled off', async () => {
        await render(
            <BrowserTestProvider>
                <PrivacyNoticeDrawer />
            </BrowserTestProvider>
        );

        // Find the label and toggle the switch
        const label = page.getByTestId('privacy-drawer-analytics-toggle');
        await userEvent.click(label);

        // Click save
        const saveBtn = page.getByTestId('privacy-drawer-save-button');
        await userEvent.click(saveBtn);

        await expect.poll(() => PrivacySettingsModule.savePrivacySettings).toHaveBeenCalledWith({
            acknowledged: true,
            analyticsEnabled: false,
        });
        await expect.poll(() => GoogleAnalyticsModule.setAnalyticsEnabled).toHaveBeenCalledWith(false);
    });
});
