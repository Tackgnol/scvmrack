import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { Box } from '@mui/material';
import { WarbandTarotDeck } from '@/components/organisms/party/WarbandTarotDeck';
import BrowserTestProvider from '../../BrowserTestProvider';

vi.mock('@/components/organisms/party/WarbandCard', () => ({
  WarbandCard: ({ name }: { name: string }) => <Box sx={{ height: 160 }}>{name}</Box>,
}));

const members = ['Azor', 'Urvarq', 'Karg'].map((name) => ({ id: name, name }) as never);

describe('WarbandTarotDeck', () => {
  it('pages an overflowing warband inside the grid drawer body (RPG-322)', async () => {
    await render(
      <BrowserTestProvider>
        <Box sx={{ display: 'grid', width: 364, height: 240 }}>
          <WarbandTarotDeck members={members} active />
        </Box>
      </BrowserTestProvider>,
    );

    const prev = page.getByRole('button', { name: /previous scvm/i });
    const next = page.getByRole('button', { name: /next scvm/i });
    await expect.element(next).toBeEnabled();
    await expect.element(prev).toBeDisabled();

    await userEvent.click(next);
    await expect.element(prev).toBeEnabled();
  });
});
