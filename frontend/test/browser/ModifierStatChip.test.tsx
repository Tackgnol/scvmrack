import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import ModifierStatChip from '@/components/atoms/ModifierStatChip';
import BrowserTestProvider from './BrowserTestProvider';

describe('ModifierStatChip Browser', () => {
  it('updates the displayed stat label when props change', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <ModifierStatChip label="STR +2" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('STR +2')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <ModifierStatChip label="AGI -1" density="compact" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('AGI -1')).toBeVisible();
    await expect.element(page.getByText('STR +2')).not.toBeInTheDocument();
  });
});
