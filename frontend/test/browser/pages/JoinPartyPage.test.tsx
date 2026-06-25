import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { JoinPartyPage } from '@/pages/JoinPartyPage';
import { useAuth } from '@/hooks/useAuth';
import {
  useJoinParty,
  useLeaveParty,
  usePartyInvite,
} from '@/hooks/usePartyRepository';
import { appHistory } from '@/router/history';
import { useQuery } from '@tanstack/react-query';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockLinkProps = { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock('@/seo/Seo', () => ({ Seo: () => null }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
vi.mock('@/hooks/charactersListQuery', () => ({ fetchCharacterList: vi.fn() }));
vi.mock('@/router/history', () => ({
  appHistory: {
    subscribe: vi.fn(() => () => {}),
    location: { pathname: '/join/tok123' },
    push: vi.fn().mockResolvedValue({ type: 'PUSHED' }),
    flush: vi.fn(),
  },
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/usePartyRepository', () => ({
  useJoinParty: vi.fn(),
  useLeaveParty: vi.fn(),
  usePartyInvite: vi.fn(),
}));

const mockedAuth = vi.mocked(useAuth);
const mockedJoin = vi.mocked(useJoinParty);
const mockedLeave = vi.mocked(useLeaveParty);
const mockedInvite = vi.mocked(usePartyInvite);
const mockedUseQuery = vi.mocked(useQuery);

function characters(data: unknown[]) {
  mockedUseQuery.mockReturnValue({ data, isLoading: false, error: null } as never);
}

const renderPage = () =>
  render(
    <BrowserTestProvider>
      <JoinPartyPage />
    </BrowserTestProvider>
  );

describe('JoinPartyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appHistory.location.pathname = '/join/tok123';
    mockedAuth.mockReturnValue({
      isLoading: false,
      session: { user: { id: 'u1' } },
    } as never);
    mockedJoin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    mockedLeave.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    mockedInvite.mockReturnValue({
      data: { id: 'p1', name: 'The Doom Choir', maxMembers: 10 },
      isLoading: false,
      error: null,
    } as never);
    characters([]);
  });
  afterEach(() => vi.clearAllMocks());

  it('joins with a chosen character and navigates to the party-character URL', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ redirect: '/party/p1/character/c1' });
    mockedJoin.mockReturnValue({ mutateAsync, isPending: false } as never);
    characters([{ id: 'c1', name: 'Vrax', partyId: null }]);
    await renderPage();

    await userEvent.click(page.getByRole('button', { name: /join party/i }));
    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ token: 'tok123', characterId: 'c1' })
    );
    await vi.waitFor(() =>
      expect(vi.mocked(appHistory.push)).toHaveBeenCalledWith('/party/p1/character/c1')
    );
  });

  it('shows the invited warband name', async () => {
    await renderPage();

    await expect.element(page.getByTestId('join-warband-name')).toBeVisible();
    await expect.element(page.getByText('The Doom Choir')).toBeVisible();
  });

  it('sends a character already in this warband straight to their sheet', async () => {
    const leaveAsync = vi.fn();
    mockedLeave.mockReturnValue({ mutateAsync: leaveAsync, isPending: false } as never);
    characters([{ id: 'c2', name: 'Azor', partyId: 'p1' }]);
    await renderPage();

    await expect.element(page.getByText('Azor is already in this warband')).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: /go to sheet/i }));
    await vi.waitFor(() =>
      expect(vi.mocked(appHistory.push)).toHaveBeenCalledWith('/party/p1/character/c2')
    );
    expect(leaveAsync).not.toHaveBeenCalled();
  });

  it('lets a character already in a party leave instead of being stuck', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockedLeave.mockReturnValue({ mutateAsync, isPending: false } as never);
    characters([{ id: 'c2', name: 'Bound', partyId: 'other' }]);
    await renderPage();
    await expect.element(page.getByText(/already in a party/i)).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: /leave party/i }));
    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ partyId: 'other', characterId: 'c2' })
    );
  });

  it('offers forge/roll linking to the dedicated join routes', async () => {
    characters([]);
    await renderPage();
    const forge = page.getByRole('link', { name: /forge a scvm/i });
    const roll = page.getByRole('link', { name: /roll and join/i });
    await expect.element(forge).toBeVisible();
    await expect.element(roll).toBeVisible();
    await expect.element(forge).toHaveAttribute('href', '/join/tok123/forge');
    await expect.element(roll).toHaveAttribute('href', '/join/tok123/roll');
  });

  it('does not bootstrap or fetch characters for a fresh invite visitor', async () => {
    mockedAuth.mockReturnValue({ isLoading: false, session: null } as never);
    characters([]);

    await renderPage();

    expect(mockedAuth).toHaveBeenCalledWith({ bootstrapAnonymous: false });
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
    await expect.element(page.getByRole('link', { name: /forge a scvm/i })).toBeVisible();
  });

  it('shows an invalid-invite alert when the token is missing', async () => {
    appHistory.location.pathname = '/join/';
    await renderPage();
    await expect.element(page.getByText(/no longer valid/i)).toBeVisible();
  });
});
