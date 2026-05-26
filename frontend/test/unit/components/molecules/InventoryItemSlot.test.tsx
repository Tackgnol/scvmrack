import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import InventoryItemSlot from '@/components/molecules/InventoryItemSlot';
import UnitTestProvider from '../../UnitTestProvider';

describe('InventoryItemSlot', () => {
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
    render(
      <UnitTestProvider>
        <InventoryItemSlot {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('TEST SWORD')).toBeTruthy();
    expect(screen.getByText('A sharp test blade.')).toBeTruthy();
  });

  it('shows quantity badge when quantity > 1', async () => {
    render(
      <UnitTestProvider>
        <InventoryItemSlot 
          {...defaultProps} 
          aggregated={{ ...defaultProps.aggregated, quantity: 3 }} 
        />
      </UnitTestProvider>
    );

    expect(screen.getByText('3×')).toBeTruthy();
  });

  it('triggers onOpenEditor when clicked', async () => {
    const onOpenEditor = vi.fn();
    render(
      <UnitTestProvider>
        <InventoryItemSlot {...defaultProps} onOpenEditor={onOpenEditor} />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    const slotLabel = screen.getByText('TEST SWORD');
    expect(slotLabel).toBeTruthy();

    await user.click(slotLabel);

    expect(onOpenEditor).toHaveBeenCalledWith(defaultProps.aggregated);
  });

  it('uses different quantity symbol for open variant', async () => {
    render(
      <UnitTestProvider>
        <InventoryItemSlot 
          {...defaultProps} 
          variant="open"
          aggregated={{ ...defaultProps.aggregated, quantity: 5 }} 
        />
      </UnitTestProvider>
    );

    expect(screen.getByText('5x')).toBeTruthy();
  });
});
