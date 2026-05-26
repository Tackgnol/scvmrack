import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import MorkBorgModalHeader from '@/components/molecules/modal/MorkBorgModalHeader';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('MorkBorgModalHeader Browser', () => {
  it('renders title', async () => {
    await render(
      <BrowserTestProvider>
        <MorkBorgModalHeader title="Modal Title" showCloseButton={false} onClose={vi.fn()} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Modal Title')).toBeVisible();

  });

  it('renders close button when showCloseButton is true', async () => {
    const onClose = vi.fn();
    await render(
      <BrowserTestProvider>
        <MorkBorgModalHeader title="Title" showCloseButton={true} onClose={onClose} />
      </BrowserTestProvider>
    );

    // ModalCloseButton has aria-label="close"
    const closeButton = page.getByRole('button', { name: /close/i });
    await expect.element(closeButton).toBeVisible();
    await userEvent.click(closeButton);

    await expect.poll(() => onClose).toHaveBeenCalled();

  });
});
