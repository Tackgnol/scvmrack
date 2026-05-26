import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ModalCloseButton from '@/components/atoms/modal/ModalCloseButton';
import UnitTestProvider from '../../UnitTestProvider';

describe('ModalCloseButton Browser', () => {
  it('renders correctly and handles click', async () => {
    const onClick = vi.fn();
    render(
      <UnitTestProvider>
        <ModalCloseButton onClick={onClick} />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const button = screen.getByRole('button', { name: 'Close modal' });
    expect(button).toBeVisible();
    await user.click(button);

    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(1));

  });

  it('respects custom aria-label', async () => {
    render(
      <UnitTestProvider>
        <ModalCloseButton onClick={() => {}} ariaLabel="Dismiss" />
      </UnitTestProvider>
    );

    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button).toBeVisible();

  });
});
