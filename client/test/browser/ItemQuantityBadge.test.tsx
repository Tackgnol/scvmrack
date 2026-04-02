import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import ItemQuantityBadge from '@/components/atoms/ItemQuantityBadge';
import BrowserTestProvider from './BrowserTestProvider';

describe('ItemQuantityBadge Browser', () => {
  it('only renders when quantity exceeds one and reflects symbol changes', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <ItemQuantityBadge quantity={1} cacheKey="test-q1" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('x')).not.toBeInTheDocument();
    await expect.element(page.getByText('5')).not.toBeInTheDocument();

    await rerender(
      <BrowserTestProvider>
        <ItemQuantityBadge quantity={5} cacheKey="test-q5" symbol="*" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('5*')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <ItemQuantityBadge quantity={1} cacheKey="test-q1-again" symbol="*" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('5*')).not.toBeInTheDocument();
  });
});
