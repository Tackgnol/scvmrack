import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import SummaryBreakdownValueRow from '@/components/molecules/summary/SummaryBreakdownValueRow';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryBreakdownValueRow Browser', () => {
  it('updates label and value without leaving stale content behind', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <SummaryBreakdownValueRow label="Base" value="10" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Base')).toBeVisible();
    await expect.element(page.getByText('10')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <SummaryBreakdownValueRow label="Armor" value="-2" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Armor')).toBeVisible();
    await expect.element(page.getByText('-2')).toBeVisible();
    await expect.element(page.getByText('Base')).not.toBeInTheDocument();
    await expect.element(page.getByText('10')).not.toBeInTheDocument();
  });
});
