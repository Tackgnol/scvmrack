import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ModalButton from '@/components/atoms/modal/ModalButton';
import UnitTestProvider from '../../UnitTestProvider';

describe('ModalButton Browser', () => {
  it('updates label and forwarded button state when props change', async () => {
    const { rerender } = render(
      <UnitTestProvider>
        <ModalButton variant="primary">PRIMARY</ModalButton>
      </UnitTestProvider>
    );

    const button = screen.getByRole('button', { name: 'PRIMARY' });
    expect(button).toBeVisible();
    expect(button).toBeEnabled();

    rerender(
      <UnitTestProvider>
        <ModalButton variant="danger" disabled>
          DANGER
        </ModalButton>
      </UnitTestProvider>
    );

    const dangerButton = screen.getByRole('button', { name: 'DANGER' });
    expect(dangerButton).toBeVisible();
    expect(screen.queryByRole('button', { name: 'PRIMARY' })).not.toBeInTheDocument();
    expect(dangerButton).toBeDisabled();
  });

  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <UnitTestProvider>
        <ModalButton onClick={onClick}>ACTION</ModalButton>
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const button = screen.getByRole('button', { name: 'ACTION' });
    expect(button).toBeVisible();
    await user.click(button);

    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(1));
  });

  it('stops firing clicks once disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <UnitTestProvider>
        <ModalButton onClick={onClick}>ACTION</ModalButton>
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const enabledButton = screen.getByRole('button', { name: 'ACTION' });
    await user.click(enabledButton);
    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(1));

    rerender(
      <UnitTestProvider>
        <ModalButton onClick={onClick} disabled>
          ACTION
        </ModalButton>
      </UnitTestProvider>
    );

    const disabledButton = screen.getByRole('button', { name: 'ACTION' });
    expect(disabledButton).toBeDisabled();
    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(1));
  });
});
