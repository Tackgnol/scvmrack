import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import EquipmentSelectionMenu from '@/components/molecules/equipped/EquipmentSelectionMenu';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('EquipmentSelectionMenu Browser', () => {
  const options = [
    { item: { key: 'item-1', name: 'Item 1', description: 'Desc 1' }, index: 0, quantity: 1 },
    { item: { key: 'item-2', name: 'Item 2', description: 'Desc 2' }, index: 1, quantity: 2 },
  ];

  const defaultProps = {
    anchorEl: document.body, // Dummy anchor for testing
    onClose: vi.fn(),
    options,
    onSelect: vi.fn(),
    selectDataTestIdPrefix: 'select-',
  };

  it('renders options when open', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentSelectionMenu {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Item 1')).toBeVisible();
    await expect.element(page.getByText('Item 2 x2')).toBeVisible();

  });

  it('triggers onSelect when an item is clicked', async () => {
    const onSelect = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquipmentSelectionMenu {...defaultProps} onSelect={onSelect} />
      </BrowserTestProvider>
    );

    const firstItem = page.getByTestId('select-0');
    await userEvent.click(firstItem);

    await expect.poll(() => onSelect).toHaveBeenCalledWith(0);

  });

  it('renders unequip option when provided', async () => {
    const onUnequip = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquipmentSelectionMenu 
          {...defaultProps} 
          equippedName="Sword" 
          onUnequip={onUnequip} 
          unequipLabel="Unequip"
          unequipDataTestId="unequip-btn"
        />
      </BrowserTestProvider>
    );

    const unequipBtn = page.getByTestId('unequip-btn');
    await expect.element(unequipBtn).toBeVisible();
    await expect.element(unequipBtn).toHaveTextContent('Unequip Sword');

    await userEvent.click(unequipBtn);
    await expect.poll(() => onUnequip).toHaveBeenCalled();

  });

  it('triggers onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquipmentSelectionMenu {...defaultProps} onClose={onClose} />
      </BrowserTestProvider>
    );

    // Click outside (e.g., body or backdrop)
    // MUI Menu uses a backdrop that can be clicked
    const presentation = page.getByRole('presentation');
    await userEvent.click(presentation, { position: { x: 0, y: 0 } });
    
    await expect.poll(() => onClose).toHaveBeenCalled();

  });
});
