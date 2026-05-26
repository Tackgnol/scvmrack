import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import AbilityValueControl from '@/components/molecules/ability/AbilityValueControl';
import UnitTestProvider from '../../../UnitTestProvider';

describe('AbilityValueControl Unit', () => {
  const defaultProps = {
    value: 10,
    label: 'Strength',
    onDecrease: vi.fn(),
    onIncrease: vi.fn(),
    onInputChange: vi.fn(),
    decreaseAriaLabel: 'Decrease Strength',
    increaseAriaLabel: 'Increase Strength',
  };

  it('renders value and label', () => {
    render(
      <UnitTestProvider>
        <AbilityValueControl {...defaultProps} />
      </UnitTestProvider>
    );

    const input = screen.getByRole('spinbutton', { name: 'Strength' });
    expect(input).toBeVisible();
    expect(input).toHaveValue(10);

  });

  it('triggers onDecrease when decrease button is clicked', async () => {
    const onDecrease = vi.fn();
    render(
      <UnitTestProvider>
        <AbilityValueControl {...defaultProps} onDecrease={onDecrease} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const decreaseButton = screen.getByRole('button', { name: 'Decrease Strength' });
    expect(decreaseButton).toBeVisible();
    await user.click(decreaseButton);

    await waitFor(() => expect(onDecrease).toHaveBeenCalled());

  });

  it('triggers onIncrease when increase button is clicked', async () => {
    const onIncrease = vi.fn();
    render(
      <UnitTestProvider>
        <AbilityValueControl {...defaultProps} onIncrease={onIncrease} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const increaseButton = screen.getByRole('button', { name: 'Increase Strength' });
    expect(increaseButton).toBeVisible();
    await user.click(increaseButton);

    await waitFor(() => expect(onIncrease).toHaveBeenCalled());

  });

  it('triggers onInputChange when value is changed', async () => {
    const onInputChange = vi.fn();
    render(
      <UnitTestProvider>
        <AbilityValueControl {...defaultProps} onInputChange={onInputChange} />
      </UnitTestProvider>
    );

    const input = screen.getByRole('spinbutton', { name: 'Strength' });
    fireEvent.change(input, { target: { value: '12' } });

    await waitFor(() => expect(onInputChange).toHaveBeenCalledWith('12'));

  });
});
