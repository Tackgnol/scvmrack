import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import SummaryEncumbranceBreakdown from '@/components/molecules/summary/SummaryEncumbranceBreakdown';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryEncumbranceBreakdown Browser', () => {
  const defaultProps = {
    title: 'Encumbrance',
    encumbrance: 5,
    maxEncumbrance: 10,
    items: [],
    emptyLabel: 'No items',
    unknownItemLabel: 'Unknown item',
  };

  it('renders base info and empty label when no items', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryEncumbranceBreakdown {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('ENCUMBRANCE')).toBeVisible();
    await expect.element(page.getByText('5 / 10')).toBeVisible();
    await expect.element(page.getByText('No items')).toBeVisible();

  });

  it('renders items correctly', async () => {
    const items = [
      { key: 'torch', name: 'Torch' },
      { key: 'rope', name: 'Rope' },
    ];

    await render(
      <BrowserTestProvider>
        <SummaryEncumbranceBreakdown {...defaultProps} items={items as any} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Torch')).toBeVisible();
    await expect.element(page.getByText('Rope')).toBeVisible();

  });

  it('renders unknown label for missing name', async () => {
    const items = [
      { key: 'mystery' },
    ];

    await render(
      <BrowserTestProvider>
        <SummaryEncumbranceBreakdown {...defaultProps} items={items as any} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('mystery')).toBeVisible();

  });
});
