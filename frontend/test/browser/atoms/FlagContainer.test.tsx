import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import { FlagContainer } from '@/components/atoms/FlagContainer';
import BrowserTestProvider from '../BrowserTestProvider';

describe('FlagContainer Component', () => {
    it('updates the rendered child content when its children change', async () => {
        const { rerender } = await render(
            <BrowserTestProvider>
                <FlagContainer>
                    <div data-testid="test-child">Child Content</div>
                </FlagContainer>
            </BrowserTestProvider>
        );

        const child = page.getByTestId('test-child');
        await expect.element(child).toBeVisible();
        await expect.element(page.getByText('Child Content')).toBeVisible();

        await rerender(
            <BrowserTestProvider>
                <FlagContainer>
                    <div data-testid="test-child">Updated Content</div>
                </FlagContainer>
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('Updated Content')).toBeVisible();
        await expect.element(page.getByText('Child Content')).not.toBeInTheDocument();
    });
});
