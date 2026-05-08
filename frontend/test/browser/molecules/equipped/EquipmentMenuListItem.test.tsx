import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import EquipmentMenuListItem from '@/components/molecules/equipped/EquipmentMenuListItem';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('EquipmentMenuListItem Browser', () => {
  const defaultProps = {
    name: 'Sword',
    description: '1d8 damage',
    quantity: 1,
    onClick: vi.fn(),
    dataTestId: 'item-1',
  };

  it('renders name and description', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentMenuListItem {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Sword')).toBeVisible();
    await expect.element(page.getByText('1d8 damage')).toBeVisible();

  });

  it('renders quantity when > 1', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentMenuListItem {...defaultProps} quantity={2} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Sword x2')).toBeVisible();

  });

  it('renders ammo count when provided', async () => {
    await render(
      <BrowserTestProvider>
        <EquipmentMenuListItem {...defaultProps} ammoCount={5} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('(5 ammo)')).toBeVisible();

  });

  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquipmentMenuListItem {...defaultProps} onClick={onClick} />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByTestId('item-1'));
    await expect.poll(() => onClick).toHaveBeenCalled();

  });
});
