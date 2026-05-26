import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi } from 'vitest';
import EquippedQuickCard from '@/components/molecules/equipped/EquippedQuickCard';
import UnitTestProvider from '../../../UnitTestProvider';

describe('EquippedQuickCard Browser', () => {
  const defaultProps = {
    icon: '⚔️',
    type: 'WEAPON',
    name: 'Broadsword',
    detail: '1d10 damage',
    noneName: 'None',
  };

  it('renders correctly when equipped', async () => {
    render(
      <UnitTestProvider>
        <EquippedQuickCard {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('⚔️')).toBeVisible();
    expect(screen.getByText('WEAPON')).toBeVisible();
    expect(screen.getByText('Broadsword')).toBeVisible();
    expect(screen.getByText('1d10 damage')).toBeVisible();

  });

  it('renders noneName when name is empty', async () => {
    render(
      <UnitTestProvider>
        <EquippedQuickCard {...defaultProps} name="" />
      </UnitTestProvider>
    );

    expect(screen.getByText('None')).toBeVisible();

  });

  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <UnitTestProvider>
        <EquippedQuickCard {...defaultProps} onClick={onClick} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('Broadsword'));
    await waitFor(() => expect(onClick).toHaveBeenCalled());

  });

  it('triggers onAmmoUse when ammo peg is clicked', async () => {
    const onAmmoUse = vi.fn();
    render(
      <UnitTestProvider>
        <EquippedQuickCard 
          {...defaultProps} 
          ammoCount={10} 
          onAmmoUse={onAmmoUse} 
          dataTestId="equipped-weapon"
        />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const ammoPeg = screen.getByTestId('equipped-weapon-ammo');
    expect(ammoPeg).toBeVisible();
    expect(ammoPeg).toHaveTextContent('10');

    await user.click(ammoPeg);
    await waitFor(() => expect(onAmmoUse).toHaveBeenCalled());

  });

  it('handles keyboard interaction (Space/Enter) when onClick provided', async () => {
    const onClick = vi.fn();
    render(
      <UnitTestProvider>
        <EquippedQuickCard {...defaultProps} onClick={onClick} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const card = screen.getByRole('button');
    await user.click(card);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onClick).toHaveBeenCalled());

  });
});
