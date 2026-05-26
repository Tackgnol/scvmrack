import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import ModalCloseButton from '@/components/atoms/modal/ModalCloseButton';
import BrowserTestProvider from '../BrowserTestProvider';

describe('ModalCloseButton Browser', () => {
  it('renders correctly and handles click', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModalCloseButton onClick={onClick} />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: 'Close modal' });
    await expect.element(button).toBeVisible();
    await userEvent.click(button);

    await expect.poll(() => onClick).toHaveBeenCalledTimes(1);

  });

  it('respects custom aria-label', async () => {
    await render(
      <BrowserTestProvider>
        <ModalCloseButton onClick={() => {}} ariaLabel="Dismiss" />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: 'Dismiss' });
    await expect.element(button).toBeVisible();

  });
});
