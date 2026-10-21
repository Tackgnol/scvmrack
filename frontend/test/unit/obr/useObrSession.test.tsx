import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { useObrSession } from '@/obr/useObrSession';
import { appHistory } from '@/router/history';
import { authKeys } from '@/api';
import { fetchSession } from '@/auth';
import { signInViaObrPopup } from '@tackgnol/rpgtools-shared-auth/client';

vi.mock('@/auth', async original => ({
  ...await original<typeof import('@/auth')>(),
  fetchSession: vi.fn(),
}));
vi.mock('@tackgnol/rpgtools-shared-auth/client', async original => ({
  ...await original<typeof import('@tackgnol/rpgtools-shared-auth/client')>(),
  signInViaObrPopup: vi.fn(),
}));

const guest = { session: { id: 'session' }, user: { id: 'obr-player', isAnonymous: true } };

beforeEach(() => {
  localStorage.clear();
  vi.mocked(fetchSession).mockReset().mockResolvedValue(guest);
  vi.mocked(signInViaObrPopup).mockReset();
  appHistory.replace('/obr.html?obrref=qa-room&character=qa-scvm');
});

function session() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(authKeys.session(), guest);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useObrSession(), { wrapper }) };
}

it('keeps the existing guest session and scvm reference when the external popup is cancelled', async () => {
  vi.mocked(signInViaObrPopup).mockRejectedValueOnce(new Error('cancelled'));
  const { result, client } = session();
  await act(async () => {
    await expect(result.current.signIn()).rejects.toThrow('cancelled');
  });
  expect(result.current.isGuest).toBe(true);
  expect(client.getQueryData(authKeys.session())).toEqual(guest);
  expect(appHistory.location.search).toContain('character=qa-scvm');
});

it('recovers an expired embedded session after successful popup sign-in without losing the room or scvm reference', async () => {
  appHistory.replace('/obr.html?obrref=qa-room&character=qa-scvm&expired=true');
  const { result } = session();
  expect(result.current.user).toBeNull();
  vi.mocked(signInViaObrPopup).mockResolvedValueOnce(undefined);
  vi.mocked(fetchSession).mockResolvedValueOnce({ ...guest, user: { ...guest.user, isAnonymous: false } });
  await act(async () => result.current.signIn());
  await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  expect(appHistory.location.search).not.toContain('expired=');
  expect(appHistory.location.search).toContain('obrref=qa-room');
  expect(appHistory.location.search).toContain('character=qa-scvm');
});
