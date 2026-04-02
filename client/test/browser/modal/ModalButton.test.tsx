import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import ModalButton from '@/components/atoms/modal/ModalButton';
import BrowserTestProvider from '../BrowserTestProvider';

describe('ModalButton Browser', () => {
  it('updates label and forwarded button state when props change', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <ModalButton variant="primary">PRIMARY</ModalButton>
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: 'PRIMARY' });
    await expect.element(button).toBeVisible();
    await expect.element(button).toBeEnabled();

    await rerender(
      <BrowserTestProvider>
        <ModalButton variant="danger" disabled>
          DANGER
        </ModalButton>
      </BrowserTestProvider>
    );

    const dangerButton = page.getByRole('button', { name: 'DANGER' });
    await expect.element(dangerButton).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'PRIMARY' })).not.toBeInTheDocument();
    await expect.element(dangerButton).toBeDisabled();
  });

  it('triggers onClick when clicked', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModalButton onClick={onClick}>ACTION</ModalButton>
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: 'ACTION' });
    await expect.element(button).toBeVisible();
    await userEvent.click(button);

    await expect.poll(() => onClick).toHaveBeenCalledTimes(1);
  });

  it('stops firing clicks once disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = await render(
      <BrowserTestProvider>
        <ModalButton onClick={onClick}>ACTION</ModalButton>
      </BrowserTestProvider>
    );

    const enabledButton = page.getByRole('button', { name: 'ACTION' });
    await userEvent.click(enabledButton);
    await expect.poll(() => onClick).toHaveBeenCalledTimes(1);

    await rerender(
      <BrowserTestProvider>
        <ModalButton onClick={onClick} disabled>
          ACTION
        </ModalButton>
      </BrowserTestProvider>
    );

    const disabledButton = page.getByRole('button', { name: 'ACTION' });
    await expect.element(disabledButton).toBeDisabled();
    await expect.poll(() => onClick).toHaveBeenCalledTimes(1);
  });
});
