import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import ModalCloseButton from '@/components/atoms/modal/ModalCloseButton';
import BrowserTestProvider from '../BrowserTestProvider';
import i18n, { loadLanguage } from '@/i18n';

describe('ModalCloseButton Browser', () => {
  it('announces the close action in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    await render(<BrowserTestProvider><ModalCloseButton onClick={vi.fn()} /></BrowserTestProvider>);
    await expect.element(page.getByRole('button', { name: 'Zamknij okno' })).toBeVisible();
  });
  it('renders correctly and handles click', async () => {
    const onClick = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModalCloseButton onClick={onClick} />
      </BrowserTestProvider>
    );

    const button = page.getByRole('button', { name: 'Close dialog' });
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
