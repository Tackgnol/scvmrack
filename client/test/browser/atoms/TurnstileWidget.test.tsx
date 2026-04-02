import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { TurnstileWidget } from '@/components/atoms/TurnstileWidget';
import BrowserTestProvider from '../BrowserTestProvider';
import * as turnstileHook from '@/hooks/useTurnstileWidget';

vi.mock('@/hooks/useTurnstileWidget', () => ({
    useTurnstileWidget: vi.fn(() => ({
        containerRef: { current: null }
    }))
}));

describe('TurnstileWidget Component', () => {
    it('passes widget config through the hook and updates resetSignal on rerender', async () => {
        const mockOnTokenChange = vi.fn();
        const mockedUseTurnstileWidget = vi.mocked(turnstileHook.useTurnstileWidget);
        
        const { rerender } = await render(
            <BrowserTestProvider>
                <TurnstileWidget 
                    siteKey="test-site-key" 
                    onTokenChange={mockOnTokenChange} 
                    resetSignal={0} 
                />
            </BrowserTestProvider>
        );

        // The text is present
        await expect.element(page.getByText('Protected by Cloudflare Turnstile')).toBeVisible();

        expect(mockedUseTurnstileWidget).toHaveBeenCalledWith({
            siteKey: 'test-site-key',
            onTokenChange: mockOnTokenChange,
            resetSignal: 0,
            theme: 'dark',
            size: 'normal',
        });

        await rerender(
            <BrowserTestProvider>
                <TurnstileWidget 
                    siteKey="test-site-key" 
                    onTokenChange={mockOnTokenChange} 
                    resetSignal={1} 
                />
            </BrowserTestProvider>
        );

        expect(mockedUseTurnstileWidget).toHaveBeenLastCalledWith({
            siteKey: 'test-site-key',
            onTokenChange: mockOnTokenChange,
            resetSignal: 1,
            theme: 'dark',
            size: 'normal',
        });
    });
});
