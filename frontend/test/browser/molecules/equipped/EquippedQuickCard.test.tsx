import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import EquippedQuickCard from '@/components/molecules/equipped/EquippedQuickCard';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('EquippedQuickCard Browser', () => {
  const defaultProps = {
    icon: '⚔️',
    type: 'WEAPON',
    name: 'Broadsword',
    detail: '1d10 damage',
    noneName: 'None',
  };

  it('renders correctly when equipped', async () => {
    await render(
      <BrowserTestProvider>
        <EquippedQuickCard {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('⚔️')).toBeVisible();
    await expect.element(page.getByText('WEAPON')).toBeVisible();
    await expect.element(page.getByText('Broadsword')).toBeVisible();
    await expect.element(page.getByText('1d10 damage')).toBeVisible();

  });

  it('renders noneName when name is empty', async () => {
    await render(
      <BrowserTestProvider>
        <EquippedQuickCard {...defaultProps} name="" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('None')).toBeVisible();

  });

  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquippedQuickCard {...defaultProps} onClick={onClick} />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByText('Broadsword'));
    await expect.poll(() => onClick).toHaveBeenCalled();

  });

  it('triggers onAmmoUse when ammo peg is clicked', async () => {
    const onAmmoUse = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquippedQuickCard 
          {...defaultProps} 
          ammoCount={10} 
          onAmmoUse={onAmmoUse} 
          dataTestId="equipped-weapon"
        />
      </BrowserTestProvider>
    );

    const ammoPeg = page.getByTestId('equipped-weapon-ammo');
    await expect.element(ammoPeg).toBeVisible();
    await expect.element(ammoPeg).toHaveTextContent('10');

    await userEvent.click(ammoPeg);
    await expect.poll(() => onAmmoUse).toHaveBeenCalled();

  });

  it('handles keyboard interaction (Space/Enter) when onClick provided', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <EquippedQuickCard {...defaultProps} onClick={onClick} />
      </BrowserTestProvider>
    );

    const card = page.getByRole('button');
    await userEvent.click(card);
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => onClick).toHaveBeenCalled();

  });
});
