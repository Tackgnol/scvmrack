import { useSyncExternalStore } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { CharacterContext } from '@/CharacterContext/CharacterContext';
import { CharacterSheet } from '@/components/organisms/CharacterSheet';
import { ObrSaveRecovery } from '@/components/obr/ObrSaveRecovery/ObrSaveRecovery';
import { useCharacterRepository } from '@/hooks/useCharacterRepository';
import { useCharacterEditor } from '@/hooks/useCharacterEditor';
import type { useCurrentCharacter } from '@/hooks/useCurrentCharacter';
import type { Character, CharacterUpdateRequest } from '@/hooks/models';
import { getCharacterKey } from '@/hooks/utils';
import { appHistory } from '@/router/history';
import { hasCurrentSearchParam } from '@/router/navigation';
import { authKeys, resetRedirectControl } from '@/api';
import { fetchSession } from '@/auth';
import { signInViaObrPopup } from '@tackgnol/rpgtools-shared-auth/client';
import BrowserTestProvider from '../BrowserTestProvider';

const transport = vi.hoisted(() => {
  const fetch = vi.fn();
  const original = globalThis.fetch;
  const proxy: typeof globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    return url.includes('/api/') ? fetch(input, init) : original(input, init);
  };
  vi.stubGlobal('fetch', proxy);
  return { fetch, proxy };
});

vi.mock('@/auth', async original => ({ ...await original<typeof import('@/auth')>(), fetchSession: vi.fn() }));
vi.mock('@tackgnol/rpgtools-shared-auth/client', async original => ({
  ...await original<typeof import('@tackgnol/rpgtools-shared-auth/client')>(), signInViaObrPopup: vi.fn(),
}));

const id = '11111111-1111-4111-8111-111111111111';
const saved: Character = { id, name: 'Recovery Scvm', currentHp: 6, maxHp: 8, omens: 2, silver: 10,
  strength: 10, agility: 10, presence: 10, toughness: 10, abilities: [], equipment: [], modifiers: [], computedModifiers: [] };
const guest = { session: {}, user: { id: 'qa-owner', isAnonymous: true } };
const subscribe = (changed: () => void) => appHistory.subscribe(changed);
const expired = () => hasCurrentSearchParam('expired');

function RecoverySheet() {
  const repo = useCharacterRepository(id, 'en', { enabled: false });
  const editor = useCharacterEditor(id, repo.updateCharacter, getCharacterKey, 'en');
  const isSessionExpired = useSyncExternalStore(subscribe, expired);
  // Context fixture supplies unused sheet actions; auth, repository, editor,
  // request middleware and recovery controls all run together without mocks.
  const context = { ...editor, characterId: id, character: editor.getVisibleCharacter(repo.character),
    locale: 'en', isAuthenticated: false, isSessionExpired, validationIssues: {},
  } as unknown as ReturnType<typeof useCurrentCharacter>;
  return <CharacterContext.Provider value={context}>
    <ObrSaveRecovery />
    <CharacterSheet stamping={false} onGenerateNew={vi.fn()} onKillScvm={vi.fn()} />
  </CharacterContext.Provider>;
}

afterEach(() => vi.unstubAllGlobals());

it('keeps a rejected edit visible, offers recovery, and resends the same save after popup sign-in', async () => {
  resetRedirectControl();
  localStorage.clear();
  appHistory.replace(`/obr.html?obrref=qa-room&character=${id}`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(getCharacterKey(id, 'en'), saved);
  client.setQueryData(authKeys.session(), guest);
  vi.mocked(fetchSession).mockResolvedValue({ ...guest, user: { ...guest.user, isAnonymous: false } });
  let authenticated = false;
  let persisted = saved;
  const bodies: CharacterUpdateRequest[] = [];
  // Only the HTTP and external popup boundaries are substituted here. The API
  // integration suite independently exercises real auth rejection/persistence.
  vi.stubGlobal('fetch', transport.proxy);
  transport.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new Request(input);
    if (request.method !== 'PATCH') {
      return Response.json({ token: 'qa-csrf' });
    }
    const body = await request.json() as CharacterUpdateRequest;
    bodies.push(body);
    if (!authenticated) {
      return Response.json({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Session expired' }, { status: 401 });
    }
    persisted = { ...persisted, ...body };
    return Response.json(persisted);
  });
  vi.mocked(signInViaObrPopup).mockImplementation(async () => { authenticated = true; });
  await render(<BrowserTestProvider><QueryClientProvider client={client}><RecoverySheet /></QueryClientProvider></BrowserTestProvider>);
  await userEvent.fill(page.getByTestId('hp-input'), '7');
  await userEvent.tab();
  await expect.poll(() => ({ count: bodies.length, search: appHistory.location.search }), { timeout: 5000 })
    .toMatchObject({ count: 2, search: expect.stringContaining('expired=true') });
  await expect.element(page.getByRole('alert')).toHaveTextContent('Your session expired. Sign in again.');
  await expect.element(page.getByTestId('hp-input')).toHaveValue('7');
  expect(persisted.currentHp).toBe(6);
  await userEvent.click(page.getByRole('button', { name: 'Sign in', exact: true }));
  await expect.poll(() => persisted.currentHp).toBe(7);
  await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  expect(bodies[bodies.length - 1]).toEqual(bodies[0]);
  expect(appHistory.location.search).toContain('obrref=qa-room');
});
