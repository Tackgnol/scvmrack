import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import BrowserTestProvider from '../BrowserTestProvider';
import { characterDetailKey, readCharacter, writeCharacter } from '@/api/characterCache';
import type { CharacterResponse } from '@/hooks/models';
import { appHistory } from '@/router/history';
import { PartyCharacterPage } from '@/pages/PartyCharacterPage';

const state = vi.hoisted(() => ({
  query: { isLoading: false, isSuccess: false, isFetching: false, error: null as unknown, data: undefined as unknown },
}));

vi.mock('@/hooks/usePartyRepository', () => ({ usePartyDetail: () => state.query }));
vi.mock('@/components/molecules/character/CharacterSheetSkeleton', () => ({ CharacterSheetSkeleton: () => <div>loading sheet</div> }));
vi.mock('@/pages/NotFoundPage', () => ({ NotFoundPage: () => <div>not found</div> }));
vi.mock('@/pages/CharacterPage', () => ({ CharacterPage: () => <div>party sheet</div> }));

const PARTY_URL = '/party/p1/character/c1';

const renderPage = async (queryClient: QueryClient) => {
  await render(
    <BrowserTestProvider>
      <QueryClientProvider client={queryClient}>
        <PartyCharacterPage />
      </QueryClientProvider>
    </BrowserTestProvider>,
  );
};

beforeEach(() => {
  appHistory.replace(PARTY_URL);
  state.query = { isLoading: false, isSuccess: false, isFetching: false, error: null, data: undefined };
});

describe('PartyCharacterPage after the scvm leaves the party', () => {
  it('settles on the plain sheet URL when the party is no longer readable', async () => {
    state.query = { ...state.query, error: { status: 404 } };
    await renderPage(new QueryClient());
    await expect.poll(() => appHistory.location.pathname).toBe('/character/c1');
  });

  it('settles on the plain sheet URL when the loaded roster no longer lists the scvm', async () => {
    state.query = { ...state.query, isSuccess: true, data: { members: [{ characterId: 'other' }] } };
    await renderPage(new QueryClient());
    await expect.poll(() => appHistory.location.pathname).toBe('/character/c1');
  });

  it('clears a stale cached partyId so the plain sheet does not send the scvm back', async () => {
    const queryClient = new QueryClient();
    writeCharacter(queryClient, 'c1', 'en', { id: 'c1', partyId: 'p1' } as CharacterResponse);
    state.query = { ...state.query, error: { status: 404 } };
    await renderPage(queryClient);
    await expect.poll(() => readCharacter(queryClient, 'c1', 'en')?.partyId).toBeNull();
    expect(queryClient.getQueryData(characterDetailKey('c1', 'en'))).toBeTruthy();
  });

  it('keeps the party URL while the roster has not loaded', async () => {
    state.query = { ...state.query, isLoading: false, isSuccess: false, isFetching: false };
    await renderPage(new QueryClient());
    expect(appHistory.location.pathname).toBe(PARTY_URL);
  });

  it('keeps the party sheet while the scvm is a member', async () => {
    state.query = { ...state.query, isSuccess: true, data: { members: [{ characterId: 'c1' }] } };
    await renderPage(new QueryClient());
    await expect.element(page.getByText('party sheet')).toBeVisible();
    expect(appHistory.location.pathname).toBe(PARTY_URL);
  });
});
