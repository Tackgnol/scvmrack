import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  pathname: '/party/p1/character/c1',
  query: { isLoading: false, isFetching: false, error: null as unknown, data: undefined as unknown },
  replace: vi.fn(),
}));

vi.mock('@/router/history', () => ({
  appHistory: {
    get location() { return { pathname: state.pathname }; },
    subscribe: () => () => undefined,
    replace: state.replace,
  },
}));
vi.mock('@/hooks/usePartyRepository', () => ({ usePartyDetail: () => state.query }));
vi.mock('@/pages/CharacterPage', () => ({ CharacterPage: () => <div>sheet</div> }));
vi.mock('@/pages/NotFoundPage', () => ({ NotFoundPage: () => <div>not-found</div> }));
vi.mock('@/components/molecules/character/CharacterSheetSkeleton', () => ({ CharacterSheetSkeleton: () => <div>skeleton</div> }));
vi.mock('@/utils/errorUtils', () => ({
  getUserFacingApiErrorMessage: () => 'error',
  isApiNotFound: (error: unknown) => (error as { status?: number })?.status === 404,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }) }));

import { PartyCharacterPage } from '@/pages/PartyCharacterPage';

describe('PartyCharacterPage after leaving the party', () => {
  beforeEach(() => {
    state.replace.mockClear();
    state.query = { isLoading: false, isFetching: false, error: null, data: undefined };
  });

  it('redirects to the plain sheet URL when the party is no longer readable', () => {
    state.query = { isLoading: false, isFetching: false, error: { status: 404 }, data: undefined };
    render(<PartyCharacterPage />);
    expect(state.replace).toHaveBeenCalledWith('/character/c1');
  });

  it('redirects when the roster no longer lists the scvm', () => {
    state.query = { isLoading: false, isFetching: false, error: null, data: { members: [{ characterId: 'other' }] } };
    render(<PartyCharacterPage />);
    expect(state.replace).toHaveBeenCalledWith('/character/c1');
  });

  it('keeps the party sheet while the scvm is a member', () => {
    state.query = { isLoading: false, isFetching: false, error: null, data: { members: [{ characterId: 'c1' }] } };
    const view = render(<PartyCharacterPage />);
    expect(view.getByText('sheet')).toBeTruthy();
    expect(state.replace).not.toHaveBeenCalled();
  });
});
