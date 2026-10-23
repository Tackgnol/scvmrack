import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { expect, it, vi } from 'vitest';
import { PartyView } from '@/components/organisms/party/PartyView';
import { useWarbandMember } from '@/hooks/useWarbandMember';
import type { WarbandMember } from '@/components/organisms/party/warbandMember';
import BrowserTestProvider from '../../BrowserTestProvider';

vi.mock('@/hooks/useWarbandMember', () => ({ useWarbandMember: vi.fn() }));

it('reaches the fourth real card after phone/desktop resizing without reopening (RPG-325)', async () => {
  const names = ['Navigator', 'Pilgrim', 'Shepherd', 'Apothecary'];
  vi.mocked(useWarbandMember).mockImplementation(id => ({
    isLoading: false, isError: false, refetch: vi.fn(),
    member: {
      id, name: id, cls: 'Custom Class', dead: false, hpText: '7/7', hpPct: 100,
      agi: '+0', pre: '+1', str: '-1', tou: '+0', dodge: 12, melee: 12, ranged: 11, dr: 0,
      dodgeC: [], meleeC: [], rangedC: [], weapon: 'Staff (d4)', armor: 'None', omenText: '2/2', silver: 20,
      modifiers: [], hasMods: false, modCount: 0, trait1: 'Quiet', trait2: 'Restless', habit: 'Collects bones',
      bodyDesc: 'Scarred', origin: 'The ash road', equipment: [], equipCount: 0,
    } satisfies WarbandMember,
  }));
  await page.viewport(390, 844);
  await render(<BrowserTestProvider><PartyView open onClose={vi.fn()} members={names.map(id => ({ id, name: id }))} /></BrowserTestProvider>);
  const track = page.getByTestId('party-strip-track');
  const next = page.getByRole('button', { name: 'Next scvm', exact: true });
  const previous = page.getByRole('button', { name: 'Previous scvm', exact: true });
  await expect.element(track).toBeVisible();
  await expect.element(next).toBeEnabled();
  await page.viewport(1440, 900);
  await expect.poll(() => track.element().clientWidth).toBeGreaterThan(1000);
  await expect.poll(() => track.element().firstElementChild?.getBoundingClientRect().width).toBe(300);
  await expect.element(next).toBeEnabled();
  await userEvent.click(next);
  await expect.poll(() => track.element().scrollWidth - track.element().clientWidth - track.element().scrollLeft).toBeLessThan(3);
  await expect.element(page.getByText('Apothecary', { exact: true })).toBeVisible();
  await page.viewport(390, 844);
  await expect.poll(() => track.element().firstElementChild?.getBoundingClientRect().width).toBe(280);
  await expect.element(next).toBeEnabled();
  for (let move = 0; move < 4 && !next.element().hasAttribute('disabled'); move++) {
    const before = track.element().scrollLeft;
    const target = Math.min(track.element().scrollWidth - track.element().clientWidth, before + 298);
    await userEvent.click(next);
    await expect.poll(() => Math.abs(track.element().scrollLeft - target)).toBeLessThan(3);
  }
  await expect.element(next).toBeDisabled();
  await expect.poll(() => track.element().scrollWidth - track.element().clientWidth - track.element().scrollLeft).toBeLessThan(3);
  for (let move = 0; move < 4 && !previous.element().hasAttribute('disabled'); move++) {
    const before = track.element().scrollLeft;
    const target = Math.max(0, before - 298);
    await userEvent.click(previous);
    await expect.poll(() => Math.abs(track.element().scrollLeft - target)).toBeLessThan(3);
  }
  await expect.element(previous).toBeDisabled();
  await expect.poll(() => track.element().scrollLeft).toBeLessThan(3);
});
