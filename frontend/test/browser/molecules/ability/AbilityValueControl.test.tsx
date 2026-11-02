import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import i18n, { loadLanguage } from '@/i18n';
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

  it('immediately displays the bounded score even when the committed value was already 21', async () => {
    const onInputChange = vi.fn();
    await render(<BrowserTestProvider><AbilityValueControl {...defaultProps} value={21} onInputChange={onInputChange} /></BrowserTestProvider>);
    const input = page.getByRole('textbox', { name: 'Strength' });
    await expect.element(page.getByText('Scores are limited to 1–21.')).not.toBeInTheDocument();
    await userEvent.fill(input, '99');
    await expect.element(input).toHaveValue('21');
    await expect.element(page.getByText('Scores are limited to 1–21.')).toBeVisible();
    await expect.poll(() => onInputChange).toHaveBeenCalledWith('21');
  });

  it('explains the score range in Polish and associates it with the input', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    try {
      await render(<BrowserTestProvider><AbilityValueControl {...defaultProps} value={21} /></BrowserTestProvider>);
      const input = page.getByRole('textbox', { name: 'Strength' });
      await userEvent.fill(input, '25');
      await expect.element(input).toHaveValue('21');
      await expect.element(page.getByText('Wartości są ograniczone do 1–21.')).toBeVisible();
      await expect.element(input).toHaveAccessibleDescription('Wartości są ograniczone do 1–21.');
    } finally {
      await i18n.changeLanguage('en');
    }
  });

  it('shows limit feedback only after a bounded step or typed value and clears it for valid input', async () => {
    const onIncrease = vi.fn();
    await render(<BrowserTestProvider><AbilityValueControl {...defaultProps} value={21} onIncrease={onIncrease} /></BrowserTestProvider>);
    const feedback = page.getByText('Scores are limited to 1–21.');
    await expect.element(feedback).not.toBeInTheDocument();
    await userEvent.click(page.getByRole('button', { name: 'Increase Strength' }));
    await expect.element(feedback).toBeVisible();
    await expect.poll(() => onIncrease).toHaveBeenCalledOnce();
    const input = page.getByRole('textbox', { name: 'Strength' });
    await userEvent.fill(input, '15');
    await expect.element(feedback).not.toBeInTheDocument();
    await userEvent.fill(input, '0');
    await expect.element(input).toHaveValue('1');
    await expect.element(feedback).toBeVisible();
  });

  it('does not show editing feedback on an untouched read-only control', async () => {
    await render(<BrowserTestProvider><fieldset disabled><AbilityValueControl {...defaultProps} /></fieldset></BrowserTestProvider>);
    await expect.element(page.getByRole('textbox', { name: 'Strength' })).toBeDisabled();
    await expect.element(page.getByText('Scores are limited to 1–21.')).not.toBeInTheDocument();
  });

  it('renders value and label', async () => {
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('textbox', { name: 'Strength' });
    await expect.element(input).toBeVisible();
    await expect.element(input).toHaveValue('10');

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

    const input = page.getByRole('textbox', { name: 'Strength' });
    await userEvent.fill(input, '12');

    await expect.poll(() => onInputChange).toHaveBeenCalledWith('12');

  });

  it('keeps an emptied field neutral instead of committing a default', async () => {
    const onInputChange = vi.fn();
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} onInputChange={onInputChange} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('textbox', { name: 'Strength' });
    await userEvent.fill(input, '');

    await expect.element(input).toHaveValue('');
    expect(onInputChange).not.toHaveBeenCalled();
  });

  it('rejects exponent notation without changing the displayed or committed value', async () => {
    const onInputChange = vi.fn();
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} onInputChange={onInputChange} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('textbox', { name: 'Strength' });
    await userEvent.fill(input, '15');
    onInputChange.mockClear();
    await userEvent.type(input, 'e');

    await expect.element(input).toHaveValue('15');
    expect(onInputChange).not.toHaveBeenCalled();
  });

  it('normalizes leading zeroes once the field is committed on blur', async () => {
    const onInputChange = vi.fn();
    await render(
      <BrowserTestProvider>
        <AbilityValueControl {...defaultProps} value={7} onInputChange={onInputChange} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('textbox', { name: 'Strength' });
    await userEvent.fill(input, '007');
    await expect.element(input).toHaveValue('007');
    expect(onInputChange).toHaveBeenLastCalledWith('007');

    await userEvent.tab();
    await expect.element(input).toHaveValue('7');
  });
});
