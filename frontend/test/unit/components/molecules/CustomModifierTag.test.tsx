import '@testing-library/jest-dom/vitest';
import {Statistic} from "@/hooks/models.ts";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CustomModifierTag from '@/components/molecules/CustomModifierTag';
import UnitTestProvider from '../../UnitTestProvider';

describe('CustomModifierTag Browser', () => {
  const mockModifier = {
    id: 'test-custom',
    name: 'Custom Bonus',
    statistic: 'agility' as Statistic,
    value: 1,
    comment: 'A special comment',
    type: 'custom' as const,
  };

  const defaultProps = {
    modifier: mockModifier,
    onRemove: vi.fn(),
    onEdit: vi.fn(),
    isFull: false,
    removeLabel: 'Remove modifier',
  };

  it('renders name, statistic, and value', async () => {
    render(
      <UnitTestProvider>
        <CustomModifierTag {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('Custom Bonus')).toBeVisible();
    expect(screen.getByText('AGILITY', { exact: true })).toBeVisible();
    expect(screen.getByText('+1')).toBeVisible();

  });

  it('triggers onEdit when clicked', async () => {
    const onEdit = vi.fn();
    render(
      <UnitTestProvider>
        <CustomModifierTag {...defaultProps} onEdit={onEdit} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const tag = screen.getByText('Custom Bonus');
    await user.click(tag);

    await waitFor(() => expect(onEdit).toHaveBeenCalled());

  });

  it('triggers onRemove when close button is clicked', async () => {
    const onRemove = vi.fn();
    render(
      <UnitTestProvider>
        <CustomModifierTag {...defaultProps} onRemove={onRemove} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const removeButton = screen.getByRole('button', {
      name: 'Remove modifier: Custom Bonus',
      exact: true,
    });
    expect(removeButton).toBeVisible();

    await user.click(removeButton);

    await waitFor(() => expect(onRemove).toHaveBeenCalled());

  });
});
