import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { Box } from '@mui/material';
import { PartyStrip } from '@/components/molecules/party/PartyStrip';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('PartyStrip', () => {
  it('exposes prev/next arrows and disables prev at the start', async () => {
    await render(
      <BrowserTestProvider>
        <Box sx={{ height: 200, width: 360 }}>
          <PartyStrip cardWidth={300}>
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ height: 160, background: '#0a0a0a' }} data-testid={`card-${i}`} />
            ))}
          </PartyStrip>
        </Box>
      </BrowserTestProvider>
    );

    // The horizontal track is the scroll surface — not a visible scrollbar.
    await expect.element(page.getByTestId('party-strip-track')).toBeVisible();

    const prev = page.getByRole('button', { name: /previous scvm/i });
    const next = page.getByRole('button', { name: /next scvm/i });
    await expect.element(prev).toBeInTheDocument();
    await expect.element(next).toBeInTheDocument();
    // At rest the track is scrolled to the start, so "previous" has nowhere to go.
    await expect.element(prev).toBeDisabled();
  });
});
