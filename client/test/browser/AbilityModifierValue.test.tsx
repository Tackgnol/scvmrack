import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import AbilityModifierValue from '@/components/atoms/AbilityModifierValue';
import BrowserTestProvider from './BrowserTestProvider';

describe('AbilityModifierValue Browser PoC', () => {
  it('updates formatting when the modifier changes sign', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <AbilityModifierValue modifier={2} cacheKey="test-pos" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('+2')).toBeVisible();
    await expect.element(page.getByText('-1')).not.toBeInTheDocument();

    await rerender(
      <BrowserTestProvider>
        <AbilityModifierValue modifier={-1} cacheKey="test-neg" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('-1')).toBeVisible();
    await expect.element(page.getByText('+2')).not.toBeInTheDocument();

    await rerender(
      <BrowserTestProvider>
        <AbilityModifierValue modifier={0} cacheKey="test-zero" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('+0')).toBeVisible();
    await expect.element(page.getByText('-1')).not.toBeInTheDocument();
  });
});
