import { renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useParty } from '@/hooks/useParty';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { usePartyDetail } from '@/hooks/usePartyRepository';
import { $api } from '@/api';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('@/CharacterContext/CharacterContext', () => ({ useCharacter: vi.fn() }));
vi.mock('@/hooks/usePartyRepository', () => ({ usePartyDetail: vi.fn() }));
vi.mock('@/api', () => ({ $api: { useQuery: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));

beforeEach(() => {
  vi.mocked($api.useQuery).mockReturnValue({ data: [{ id: 'first', partyId: 'party-a' }, { id: 'second', partyId: 'party-b' }], refetch: vi.fn() } as never);
  vi.mocked(usePartyDetail).mockReturnValue({ data: { members: [] }, refetch: vi.fn() } as never);
});
it.each([['first', 'party-a'], ['second', 'party-b'], ['unbound', null]])('uses the party of current scvm %s', (id, partyId) => {
  vi.mocked(useCharacter).mockReturnValue({ characterId: id, character: { id, partyId } } as never);
  renderHook(() => useParty());
  expect(usePartyDetail).toHaveBeenLastCalledWith(partyId, Boolean(partyId));
});
it('does not show a different party while the requested scvm is loading', () => {
  vi.mocked(useCharacter).mockReturnValue({ characterId: 'loading', character: undefined } as never);
  renderHook(() => useParty());
  expect(usePartyDetail).toHaveBeenLastCalledWith(null, false);
});
it('keeps the account fallback away from a sheet', () => {
  vi.mocked(useCharacter).mockReturnValue({ characterId: null } as never);
  renderHook(() => useParty());
  expect(usePartyDetail).toHaveBeenLastCalledWith('party-a', true);
});
