import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ComputedModifierTag from '@/components/molecules/ComputedModifierTag';
import UnitTestProvider from '../../UnitTestProvider';

describe('ComputedModifierTag Browser', () => {
  const mockModifier = {
    id: 'test-mod',
    statistic: 'strength',
    value: 2,
    originName: 'Belt of Giant Strength',
    type: 'computed' as const,
  };

  const defaultProps = {
    modifier: mockModifier,
    onOpen: vi.fn(),
    isFull: false,
  };

  it('renders origin name, statistic, and value', async () => {
    render(
      <UnitTestProvider>
        <ComputedModifierTag {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('Belt of Giant Strength')).toBeVisible();
    expect(screen.getByText('STRENGTH', { exact: true })).toBeVisible();
    expect(screen.getByText('+2')).toBeVisible();

  });

  it('triggers onOpen when clicked', async () => {
    const onOpen = vi.fn();
    render(
      <UnitTestProvider>
        <ComputedModifierTag {...defaultProps} onOpen={onOpen} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const tag = screen.getByRole('button');
    await user.click(tag);

    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(mockModifier));

  });
});
