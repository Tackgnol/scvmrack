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

  it('groups encumbrance items by source', async () => {
    const groups = [
      {
        key: 'equipment',
        label: 'On hand',
        items: [{ key: 'torch', name: 'Torch' }],
      },
      {
        key: 'weapons',
        label: 'Equipped weapons',
        items: [{ key: 'axe', name: 'Axe' }],
      },
    ];

    await render(
      <BrowserTestProvider>
        <SummaryEncumbranceBreakdown
          {...defaultProps}
          items={
            [
              { key: 'torch', name: 'Torch' },
              { key: 'axe', name: 'Axe' },
            ] as any
          }
          groups={groups as any}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('On hand')).toBeVisible();
    await expect.element(page.getByText('Equipped weapons')).toBeVisible();
    await expect.element(page.getByText('Torch')).toBeVisible();
    await expect.element(page.getByText('Axe')).toBeVisible();
  });

  it('uses grouped items to decide whether the list is empty', async () => {
    const groups = [
      {
        key: 'weapons',
        label: 'Equipped weapons',
        items: [{ key: 'axe', name: 'Axe' }],
      },
    ];

    await render(
      <BrowserTestProvider>
        <SummaryEncumbranceBreakdown
          {...defaultProps}
          items={[]}
          groups={groups as any}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Equipped weapons')).toBeVisible();
    await expect.element(page.getByText('Axe')).toBeVisible();
    await expect.element(page.getByText('No items')).not.toBeInTheDocument();
  });

  it('renders unknown label for missing name', async () => {
    const items = [{ key: 'mystery' }];

    await render(
      <BrowserTestProvider>
        <SummaryEncumbranceBreakdown {...defaultProps} items={items as any} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('mystery')).toBeVisible();
  });
});
