import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { PrivacyNoticeDrawer } from '@/components/organisms/PrivacyNoticeDrawer';
import BrowserTestProvider from '../BrowserTestProvider';
import * as GoogleAnalyticsModule from '@/analytics/googleAnalytics';
import * as PrivacySettingsModule from '@/privacy/privacySettings';
import * as PrivacyDrawerBusModule from '@/privacy/privacyDrawerBus';

vi.mock('@/analytics/googleAnalytics', () => ({
    setAnalyticsEnabled: vi.fn(),
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
    });

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
