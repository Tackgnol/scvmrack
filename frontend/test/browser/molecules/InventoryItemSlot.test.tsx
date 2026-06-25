import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import InventoryItemSlot from '@/components/molecules/InventoryItemSlot';
import BrowserTestProvider from '../BrowserTestProvider';

describe('InventoryItemSlot Browser', () => {
  const mockItem = {
    key: 'test-item',
    name: 'TEST SWORD',
    description: 'A sharp test blade.',
  };

  const defaultProps = {
    aggregated: {
      item: mockItem,
      indices: [0],
      quantity: 1,
    },
    location: 'equipment' as const,
    variant: 'stored' as const,
    onOpenEditor: vi.fn(),
  };

  it('renders item name and description', async () => {
    await render(
      <BrowserTestProvider>
        <InventoryItemSlot {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('TEST SWORD')).toBeVisible();
    await expect.element(page.getByText('A sharp test blade.')).toBeVisible();

  });

  it('shows quantity badge when quantity > 1', async () => {
    await render(
      <BrowserTestProvider>
        <InventoryItemSlot 
          {...defaultProps} 
          aggregated={{ ...defaultProps.aggregated, quantity: 3 }} 
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('3')).toBeVisible();
    await expect.element(page.getByText('×')).toBeVisible(); // 'stored' variant uses '×'

  });

  it('triggers onOpenEditor when clicked', async () => {
    const onOpenEditor = vi.fn();
    await render(
      <BrowserTestProvider>
        <InventoryItemSlot {...defaultProps} onOpenEditor={onOpenEditor} />
      </BrowserTestProvider>
    );

    const slot = page.getByRole('button', { name: /TEST SWORD/i });
    await expect.element(slot).toBeVisible();

    await userEvent.click(slot);

    expect(onOpenEditor).toHaveBeenCalledWith(defaultProps.aggregated);

  });

  it('triggers onOpenEditor from keyboard activation', async () => {
    const onOpenEditor = vi.fn();
    await render(
      <BrowserTestProvider>
        <InventoryItemSlot {...defaultProps} onOpenEditor={onOpenEditor} />
      </BrowserTestProvider>
    );

    const slot = page.getByRole('button', { name: /TEST SWORD/i });
    await userEvent.click(slot);
    await userEvent.keyboard('{Enter}');

    await expect.poll(() => onOpenEditor).toHaveBeenCalledWith(defaultProps.aggregated);

  });

  it('uses different quantity symbol for open variant', async () => {
    await render(
      <BrowserTestProvider>
        <InventoryItemSlot 
          {...defaultProps} 
          variant="open"
          aggregated={{ ...defaultProps.aggregated, quantity: 5 }} 
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('5')).toBeVisible();
    await expect.element(page.getByText('x')).toBeVisible(); // 'open' variant uses 'x'

  });
});
