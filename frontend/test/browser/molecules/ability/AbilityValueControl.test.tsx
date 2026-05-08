import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import AbilityValueControl from '@/components/molecules/ability/AbilityValueControl';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('AbilityValueControl Browser', () => {
  const defaultProps = {
    value: 10,
    label: 'Strength',
    onDecrease: vi.fn(),
    onIncrease: vi.fn(),
    onInputChange: vi.fn(),
    decreaseAriaLabel: 'Decrease Strength',
    increaseAriaLabel: 'Increase Strength',
  };

  it('renders value and label', async () => {
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('spinbutton', { name: 'Strength' });
    await expect.element(input).toBeVisible();
    await expect.element(input).toHaveValue(10);

  });

  it('triggers onDecrease when decrease button is clicked', async () => {
    const onDecrease = vi.fn();
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} onDecrease={onDecrease} />
      </BrowserTestProvider>
    );

    const decreaseButton = page.getByRole('button', { name: 'Decrease Strength' });
    await expect.element(decreaseButton).toBeVisible();
    await userEvent.click(decreaseButton);

    await expect.poll(() => onDecrease).toHaveBeenCalled();

  });

  it('triggers onIncrease when increase button is clicked', async () => {
    const onIncrease = vi.fn();
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} onIncrease={onIncrease} />
      </BrowserTestProvider>
    );

    const increaseButton = page.getByRole('button', { name: 'Increase Strength' });
    await expect.element(increaseButton).toBeVisible();
    await userEvent.click(increaseButton);

    await expect.poll(() => onIncrease).toHaveBeenCalled();

  });

  it('triggers onInputChange when value is changed', async () => {
    const onInputChange = vi.fn();
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} onInputChange={onInputChange} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('spinbutton', { name: 'Strength' });
    await userEvent.fill(input, '12');

    await expect.poll(() => onInputChange).toHaveBeenCalledWith('12');

  });
});
