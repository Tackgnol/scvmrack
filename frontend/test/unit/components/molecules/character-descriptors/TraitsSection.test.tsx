import { fireEvent, render, screen } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import TraitsSection from '@/components/molecules/character-descriptors/TraitsSection';
import UnitTestProvider from '../../../UnitTestProvider';

describe('TraitsSection Unit', () => {
  const defaultProps = {
    trait1: 'cowardly',
    trait2: 'weak',
    habit: 'twitches',
    bodyDescription: 'thin',
    onChangeField: vi.fn(),
  };

  it('renders all trait fields', () => {
    render(
      <UnitTestProvider>
        <TraitsSection {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('trait1-input')).toHaveValue('cowardly');
    expect(screen.getByTestId('trait2-input')).toHaveValue('weak');
    expect(screen.getByTestId('habit-input')).toHaveValue('twitches');
    expect(screen.getByTestId('body-description-input')).toHaveValue('thin');

  });

  it('triggers onChangeField when fields are changed', async () => {
    const onChangeField = vi.fn();
    render(
      <UnitTestProvider>
        <TraitsSection {...defaultProps} onChangeField={onChangeField} />
      </UnitTestProvider>
    );
    const input1 = screen.getByTestId('trait1-input');
    fireEvent.change(input1, { target: { value: 'brave' } });
    expect(onChangeField).toHaveBeenCalledWith('trait1', 'brave');

    const habitInput = screen.getByTestId('habit-input');
    fireEvent.change(habitInput, { target: { value: 'shouts' } });
    expect(onChangeField).toHaveBeenCalledWith('habit', 'shouts');

  });
});
