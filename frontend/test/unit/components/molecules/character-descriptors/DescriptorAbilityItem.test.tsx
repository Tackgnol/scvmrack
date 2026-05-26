import { fireEvent, render, screen } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import DescriptorAbilityItem from '@/components/molecules/character-descriptors/DescriptorAbilityItem';
import UnitTestProvider from '../../../UnitTestProvider';

describe('DescriptorAbilityItem Unit', () => {
  const defaultProps = {
    ability: {
      name: 'Test Ability',
      description: 'Test Description',
      comment: '',
    },
    index: 0,
    onUpdateComment: vi.fn(),
  };

  it('renders name and description', () => {
    render(
      <UnitTestProvider>
        <DescriptorAbilityItem {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('Test Ability')).toBeVisible();
    expect(screen.getByText('Test Description')).toBeVisible();

  });

  it('triggers onUpdateComment when comment is changed', async () => {
    const onUpdateComment = vi.fn();
    render(
      <UnitTestProvider>
        <DescriptorAbilityItem 
          {...defaultProps} 
          onUpdateComment={onUpdateComment} 
          ability={{ ...defaultProps.ability, comment: 'old' }}
        />
      </UnitTestProvider>
    );
    const input = screen.getByTestId('ability-comment-0-input');
    fireEvent.change(input, { target: { value: 'new comment' } });

    expect(onUpdateComment).toHaveBeenCalledWith('new comment');

  });

  it('shows decoctions button for Occult Herbmaster with Portable Laboratory', () => {
    render(
      <UnitTestProvider>
        <DescriptorAbilityItem 
          {...defaultProps} 
          isOccultHerbmaster={true}
          ability={{ 
            name: 'Portable Laboratory', 
            description: 'desc',
            comment: '' 
          }}
        />
      </UnitTestProvider>
    );

    const button = screen.getByRole('button', { name: /VIEW DECOCTIONS/i });
    expect(button).toBeVisible();

  });
});
