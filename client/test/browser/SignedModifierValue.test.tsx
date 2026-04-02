import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import SignedModifierValue from '@/components/atoms/SignedModifierValue';
import BrowserTestProvider from './BrowserTestProvider';

describe('SignedModifierValue Browser', () => {
  it('updates signed formatting as the numeric value changes', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <SignedModifierValue value={5} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('+5')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <SignedModifierValue value={0} size="compact" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('0')).toBeVisible();
    await expect.element(page.getByText('+5')).not.toBeInTheDocument();

    await rerender(
      <BrowserTestProvider>
        <SignedModifierValue value={-3} pulse />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('-3')).toBeVisible();
    await expect.element(page.getByText('0')).not.toBeInTheDocument();
  });
});
