import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Box } from '@mui/material';
import { PartySheetPill } from '@/components/organisms/party/PartySheetPill';
import { usePartyDetail } from '@/hooks/usePartyRepository';
import { usePartyStream } from '@/hooks/usePartyStream';
import BrowserTestProvider from '../../BrowserTestProvider';

vi.mock('@/hooks/usePartyRepository', () => ({ usePartyDetail: vi.fn() }));
vi.mock('@/hooks/usePartyStream', () => ({ usePartyStream: vi.fn() }));
vi.mock('@/components/organisms/party/WarbandCard', () => ({
  WarbandCard: ({ name }: { name: string }) => <Box sx={{ height: 160 }}>{name}</Box>,
}));

const withWarband = (...names: string[]) =>
  vi.mocked(usePartyDetail).mockReturnValue({
    data: {
      id: 'party-1',
      name: 'Test',
      memberCount: names.length,
      members: names.map((name) => ({ characterId: name, name })),
    },
  } as never);

const openDrawer = async () => {
  await render(
    <BrowserTestProvider>
      <PartySheetPill partyId="party-1" characterId="Azor" />
    </BrowserTestProvider>,
  );
  await userEvent.click(page.getByTestId('party-sheet-pill'));
  await expect.element(page.getByTestId('party-roster-drawer')).toBeVisible();
};

const prev = () => page.getByRole('button', { name: 'Previous scvm' });
const next = () => page.getByRole('button', { name: 'Next scvm' });

describe('PartySheetPill scvm arrows (RPG-322)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePartyStream).mockReturnValue({
      changedFieldsByCharacter: {},
      presenceByCharacter: {},
      clearChangedFields: vi.fn(),
    } as never);
  });

  it('page an overflowing warband on a phone, follow a manual scroll, and work after reopening', async () => {
    await page.viewport(390, 844);
    withWarband('Azor', 'Urvarq', 'Karg');
    await openDrawer();

    await expect.element(next()).toBeEnabled();
    await expect.element(prev()).toBeDisabled();
    await userEvent.click(next());
    await expect.element(prev()).toBeEnabled();

    const track = page.getByTestId('party-strip-track').element();
    track.scrollLeft = track.scrollWidth;
    track.dispatchEvent(new Event('scroll'));
    await expect.element(next()).toBeDisabled();

    await userEvent.click(page.getByRole('button', { name: 'Close', exact: true }));
    await expect.element(page.getByTestId('party-roster-drawer')).not.toBeInTheDocument();
    await userEvent.click(page.getByTestId('party-sheet-pill'));
    await expect.element(next()).toBeEnabled();
    await userEvent.click(next());
    await expect.element(prev()).toBeEnabled();
  });

  it('turn on when a resize makes the warband overflow', async () => {
    await page.viewport(1440, 900);
    withWarband('Azor', 'Urvarq', 'Karg');
    await openDrawer();

    await expect.element(page.getByText('Karg')).toBeVisible();
    await expect.element(next()).toBeDisabled();
    await page.viewport(390, 844);
    await expect.element(next()).toBeEnabled();
  });

  it('stay off when a single scvm fits on a phone', async () => {
    await page.viewport(390, 844);
    withWarband('Azor');
    await openDrawer();

    await expect.element(page.getByText('Azor')).toBeVisible();
    await expect.element(next()).toBeDisabled();
    await expect.element(prev()).toBeDisabled();
  });
});
