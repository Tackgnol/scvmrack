import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import TraitsSection from '@/components/molecules/character-descriptors/TraitsSection';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('TraitsSection Browser', () => {
  const defaultProps = {
    trait1: 'cowardly',
    trait2: 'weak',
    habit: 'twitches',
    bodyDescription: 'thin',
    onChangeField: vi.fn(),
  };

  it('renders all trait fields', async () => {
    await render(
      <BrowserTestProvider>
        <TraitsSection {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByTestId('trait1-input')).toHaveValue('cowardly');
    await expect.element(page.getByTestId('trait2-input')).toHaveValue('weak');
    await expect.element(page.getByTestId('habit-input')).toHaveValue('twitches');
    await expect.element(page.getByTestId('body-description-input')).toHaveValue('thin');

  });

  it('triggers onChangeField when fields are changed', async () => {
    const onChangeField = vi.fn();
    await render(
      <BrowserTestProvider>
        <TraitsSection {...defaultProps} onChangeField={onChangeField} />
      </BrowserTestProvider>
    );

    const input1 = page.getByTestId('trait1-input');
    await userEvent.fill(input1, 'brave');
    await expect.poll(() => onChangeField).toHaveBeenCalledWith('trait1', 'brave');

    const habitInput = page.getByTestId('habit-input');
    await userEvent.fill(habitInput, 'shouts');
    await expect.poll(() => onChangeField).toHaveBeenCalledWith('habit', 'shouts');

  });
});
