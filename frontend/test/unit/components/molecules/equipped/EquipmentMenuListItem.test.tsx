import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi } from 'vitest';
import EquipmentMenuListItem from '@/components/molecules/equipped/EquipmentMenuListItem';
import UnitTestProvider from '../../../UnitTestProvider';

describe('EquipmentMenuListItem Browser', () => {
  const defaultProps = {
    name: 'Sword',
    description: '1d8 damage',
    quantity: 1,
    onClick: vi.fn(),
    dataTestId: 'item-1',
  };

  it('renders name and description', async () => {
    render(
      <UnitTestProvider>
        <EquipmentMenuListItem {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('Sword')).toBeVisible();
    expect(screen.getByText('1d8 damage')).toBeVisible();

  });

  it('renders quantity when > 1', async () => {
    render(
      <UnitTestProvider>
        <EquipmentMenuListItem {...defaultProps} quantity={2} />
      </UnitTestProvider>
    );

    expect(screen.getByText('Sword x2')).toBeVisible();

  });

  it('renders ammo count when provided', async () => {
    render(
      <UnitTestProvider>
        <EquipmentMenuListItem {...defaultProps} ammoCount={5} />
      </UnitTestProvider>
    );

    expect(screen.getByText('(5 ammo)')).toBeVisible();

  });

  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <UnitTestProvider>
        <EquipmentMenuListItem {...defaultProps} onClick={onClick} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId('item-1'));
    await waitFor(() => expect(onClick).toHaveBeenCalled());

  });
});
