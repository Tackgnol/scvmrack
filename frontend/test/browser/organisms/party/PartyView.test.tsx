import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { PartyView } from '@/components/organisms/party/PartyView';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('PartyView', () => {
  it('shows the warband heading and an empty state when the rack is empty', async () => {
    await render(
      <BrowserTestProvider>
        <PartyView open onClose={vi.fn()} members={[]} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('The Warband', { exact: true })).toBeVisible();
    await expect.element(page.getByTestId('party-empty')).toBeVisible();
  });

  it('closes when the close control is clicked', async () => {
    const onClose = vi.fn();
    await render(
      <BrowserTestProvider>
        <PartyView open onClose={onClose} members={[]} />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByTestId('party-close'));
    await expect.poll(() => onClose).toHaveBeenCalled();
  });
});
