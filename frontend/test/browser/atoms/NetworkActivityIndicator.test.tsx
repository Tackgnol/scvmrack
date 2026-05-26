import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { NetworkActivityIndicator } from '@/components/atoms/NetworkActivityIndicator';
import * as rq from '@tanstack/react-query';
import BrowserTestProvider from '../BrowserTestProvider';

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-query')>();
    return {
        ...actual,
        useIsFetching: vi.fn(),
        useIsMutating: vi.fn(),
    };
});

describe('NetworkActivityIndicator Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.mocked(rq.useIsFetching).mockReturnValue(0);
        vi.mocked(rq.useIsMutating).mockReturnValue(0);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('remains hidden when neither fetching nor mutating', async () => {
        await render(
            <BrowserTestProvider>
                <NetworkActivityIndicator />
            </BrowserTestProvider>
        );

        // We can just verify the image isn't visible, or the fade parent isn't visible.
        // It's using Fade unmountOnExit, so the image shouldn't exist in DOM.
        const img = page.getByAltText('');
        await expect.element(img).not.toBeInTheDocument();
    });

    it('becomes visible after SHOW_DELAY_MS when fetching starts', async () => {
        // Mock to simulate fetching
        vi.mocked(rq.useIsFetching).mockReturnValue(1);

        await render(
            <BrowserTestProvider>
                <NetworkActivityIndicator />
            </BrowserTestProvider>
        );

        // Immediately, it shouldn't be visible due to 150ms delay
        await expect.element(page.getByRole('presentation')).not.toBeInTheDocument();

        // Advance past the 150ms SHOW_DELAY_MS
        await vi.advanceTimersByTimeAsync(200);

        // Should be visible now
        const img = page.getByAltText('');
        await expect.element(img).toBeVisible();
    });

    it('tests image load failure fallback', async () => {
        vi.mocked(rq.useIsFetching).mockReturnValue(1);

        await render(
            <BrowserTestProvider>
                <NetworkActivityIndicator />
            </BrowserTestProvider>
        );

        await vi.advanceTimersByTimeAsync(200);

        const img = page.getByAltText('');
        await expect.element(img).toBeVisible();

        // Trigger error event on the image
        // In vitest browser we can extract the element and dispatch
        const domElement = img.element();
        if (domElement) {
            domElement.dispatchEvent(new Event('error'));
        }

        // Image should disappear, replaced by the Box fallback.
        // Not being an img is proof enough the fallback branch took over.
        await expect.element(img).not.toBeInTheDocument();
    });
});
