import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import DescriptorAbilityItem from '@/components/molecules/character-descriptors/DescriptorAbilityItem';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('DescriptorAbilityItem Browser', () => {
  const defaultProps = {
    ability: {
      name: 'Test Ability',
      description: 'Test Description',
      comment: '',
    },
    index: 0,
    onUpdateComment: vi.fn(),
  };

  it('renders name and description', async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Test Ability')).toBeVisible();
    await expect.element(page.getByText('Test Description')).toBeVisible();

  });

  it('triggers onUpdateComment when comment is changed', async () => {
    const onUpdateComment = vi.fn();
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem 
          {...defaultProps} 
          onUpdateComment={onUpdateComment} 
          ability={{ ...defaultProps.ability, comment: 'old' }}
        />
      </BrowserTestProvider>
    );

    const input = page.getByTestId('ability-comment-0-input');
    await userEvent.fill(input, 'new comment');

    expect(onUpdateComment).toHaveBeenCalledWith('new comment');

  });

  it('shows decoctions button for Occult Herbmaster with Portable Laboratory', async () => {
    await render(
      <BrowserTestProvider>
        <DescriptorAbilityItem 
          {...defaultProps} 
          isOccultHerbmaster={true}
          ability={{ 
            name: 'Portable Laboratory', 
            description: 'desc',
            comment: '' 
          }}
        />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: /VIEW DECOCTIONS/i });
    await expect.element(button).toBeVisible();

  });
});
