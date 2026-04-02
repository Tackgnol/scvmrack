import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import SummaryListItemRow from '@/components/molecules/summary/SummaryListItemRow';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryListItemRow Browser', () => {
  it('updates the displayed label when props change', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <SummaryListItemRow label="Sword" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Sword')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <SummaryListItemRow label="Leather Armor" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Leather Armor')).toBeVisible();
    await expect.element(page.getByText('Sword')).not.toBeInTheDocument();
  });
});
