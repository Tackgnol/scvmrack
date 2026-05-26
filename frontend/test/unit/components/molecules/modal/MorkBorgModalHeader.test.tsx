import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi } from 'vitest';
import MorkBorgModalHeader from '@/components/molecules/modal/MorkBorgModalHeader';
import UnitTestProvider from '../../../UnitTestProvider';

describe('MorkBorgModalHeader', () => {
  it('renders title', async () => {
    render(
      <UnitTestProvider>
        <MorkBorgModalHeader title="Modal Title" showCloseButton={false} onClose={vi.fn()} />
      </UnitTestProvider>
    );

    expect(screen.getByText('Modal Title')).toBeTruthy();
  });

  it('renders close button when showCloseButton is true', async () => {
    const onClose = vi.fn();
    render(
      <UnitTestProvider>
        <MorkBorgModalHeader title="Title" showCloseButton={true} onClose={onClose} />
      </UnitTestProvider>
    );

    const user = userEvent.setup();
    // ModalCloseButton has aria-label="close"
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeTruthy();
    await user.click(closeButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
