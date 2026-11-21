import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { useCharacterEditor } from '@/hooks/useCharacterEditor';
import { trackCharacterEdited } from '@/analytics/characterAnalytics';
import {
  characterDetailKey,
  characterRosterKey,
  ownedCharactersKey,
  readCharacter,
  writeCharacter,
} from '@/api/characterCache';
import type { CharacterResponse, CharacterUpdateRequest } from '@/hooks/models';

const http = vi.hoisted(() => ({
  fetch: vi.fn<(request: Request) => Promise<Response>>(),
}));
const snackbarMocks = vi.hoisted(() => ({
  showError: vi.fn(),
}));
const errorFeedbackMocks = vi.hoisted(() => ({
  showUnexpectedError: vi.fn(() => true),
}));

// The app's HTTP client with only its transport replaced: the same openapi-fetch and
// openapi-react-query stack, without the auth and CSRF middleware, over a scripted fetch.
vi.mock('@/api', async () => {
  const { default: createClient } = await import('openapi-fetch');
  const { default: createQueryClient } = await import('openapi-react-query');
  const client = createClient({
    baseUrl: 'http://api.test',
    fetch: (request: Request) => http.fetch(request),
  });
  return { $api: createQueryClient(client) };
});

vi.mock('@/SnackbarContext/SnackbarProvider.tsx', () => ({
  useSnackbar: () => ({ showError: snackbarMocks.showError }),
}));

vi.mock('@/components/molecules/feedback/ErrorFeedbackProvider', () => ({
  useErrorFeedback: () => errorFeedbackMocks,
}));

vi.mock('@/analytics/characterAnalytics', () => ({
  trackCharacterEdited: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, values?: Record<string, unknown>) => {
      if (key === 'validation.fields.silver') {
        return 'Silver';
      }
      if (!fallback) {
        return key;
      }
      return fallback.replace(/\{\{(\w+)}}/g, (_match, token) =>
        String(values?.[token] ?? '')
      );
    },
  }),
}));

/** How long the editor waits after the last edit before it saves. */
const SAVE_DELAY = 1000;

type TestCharacter = Record<string, unknown> & { id: string };
type SaveRequest = { id: string; locale: string | null; body: CharacterUpdateRequest };
type SheetProps = { id: string; locale: string; readOnly?: boolean };

const asCharacter = (character: TestCharacter) => character as CharacterResponse;

/** Lets time pass: the save delay runs out, requests leave, answers are handled. */
const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

/** Runs an interaction and lets what it starts at once (a request leaving) happen, without passing time. */
const perform = (interaction: () => void) =>
  act(async () => {
    interaction();
    await vi.advanceTimersByTimeAsync(0);
  });

/** A real cache holding the given characters, each under its own id in English. */
function makeCache(...characters: TestCharacter[]) {
  const queryClient = new QueryClient();
  for (const character of characters) {
    writeCharacter(queryClient, character.id, 'en', asCharacter(character));
  }
  return {
    queryClient,
    cached: (id: string, language = 'en') => readCharacter(queryClient, id, language),
    isStale: (key: readonly unknown[]) => queryClient.getQueryState(key)?.isInvalidated,
    /** Mounts a reader of that copy, as an open sheet does; its refetches are answered by `serve`. */
    watchRefetches: (
      id: string,
      language = 'en',
      serve: () => TestCharacter | undefined = () => undefined
    ) => {
      const refetch = vi.fn(async () => serve() ?? readCharacter(queryClient, id, language) ?? null);
      new QueryObserver(queryClient, {
        queryKey: characterDetailKey(id, language),
        queryFn: refetch,
        staleTime: Infinity,
      }).subscribe(() => {});
      return refetch;
    },
  };
}

/** The scripted backend: records every save and leaves it in flight until the test answers it. */
function fakeServer() {
  const requests: SaveRequest[] = [];
  const inFlight: Array<{ resolve: (response: Response) => void; reject: (error: unknown) => void }> = [];
  http.fetch.mockImplementation(async (request) => {
    const url = new URL(request.url);
    const body = (await request.json()) as CharacterUpdateRequest;
    requests.push({
      id: url.pathname.split('/').pop() ?? '',
      locale: url.searchParams.get('locale'),
      body,
    });
    return new Promise<Response>((resolve, reject) => {
      inFlight.push({ resolve, reject });
    });
  });
  const answer = async (deliver: (save: (typeof inFlight)[number]) => void) => {
    const save = inFlight.shift();
    if (!save) {
      throw new Error('No save is in flight');
    }
    await act(async () => {
      deliver(save);
      await vi.advanceTimersByTimeAsync(0);
    });
  };
  return {
    requests,
    /** Answers the oldest save in flight with the character as the server stored it. */
    saves: (character: TestCharacter) => answer((save) => save.resolve(Response.json(character))),
    /** Answers the oldest save in flight with an API error. */
    rejects: (statusCode: number, payload: Record<string, unknown> = {}) =>
      answer((save) => save.resolve(Response.json({ statusCode, ...payload }, { status: statusCode }))),
    /** Loses the oldest save in flight: the request left, no response arrives. */
    dropsConnection: () => answer((save) => save.reject(new TypeError('Failed to fetch'))),
  };
}

/** Mounts the editor for a character the way the sheet does, over the given cache. */
function openSheet(queryClient: QueryClient, initial: Partial<SheetProps> & { id: string }) {
  let props: SheetProps = { locale: 'en', ...initial };
  const view = renderHook(
    (current: SheetProps) =>
      useCharacterEditor(current.id, current.locale, undefined, { readOnly: current.readOnly }),
    {
      initialProps: props,
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    }
  );
  return {
    get editor() {
      return view.result.current;
    },
    /** The character on screen: the cached copy as the editor presents it. */
    visible: () =>
      view.result.current.getVisibleCharacter(readCharacter(queryClient, props.id, props.locale)),
    switchTo: (next: Partial<SheetProps>) => {
      props = { ...props, ...next };
      view.rerender(props);
    },
    close: () => view.unmount(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  errorFeedbackMocks.showUnexpectedError.mockReturnValue(true);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test.each(['add', 'move', 'unequip-weapon', 'unequip-armor'] as const)('rejects an inventory %s at capacity without changing either container', async (operation) => {
  const equipment = Array.from({ length: 50 }, (_, i) => ({ key: `equipment.${i}`, name: `Item ${i}` }));
  const storage = [{ key: 'equipment.rope', name: 'Rope' }];
  const equippedWeapons = [{ key: 'weapons.sword', name: 'Sword' }];
  const equippedArmor = { key: 'armor.leather', name: 'Leather' };
  const { queryClient } = makeCache({ id: 'char-1', equipment, storage, equippedWeapons, equippedArmor });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => {
    if (operation === 'add') {
      sheet.editor.addEquipmentItem({ key: 'equipment.hammer', name: 'Hammer' });
    } else if (operation === 'move') {
      sheet.editor.moveToEquipment(0);
    } else if (operation === 'unequip-weapon') {
      sheet.editor.unequipWeapon(0);
    } else {
      sheet.editor.unequipArmor();
    }
  });
  await wait(SAVE_DELAY);

  expect(sheet.visible()).toMatchObject({ equipment, storage, equippedWeapons, equippedArmor });
  expect(server.requests).toHaveLength(0);
  expect(sheet.editor.isSaving).toBe(false);
  expect(snackbarMocks.showError).toHaveBeenCalled();
});

test.each([['equipment', 50], ['storage', 100]] as const)('fills the last %s slot and rejects the next addition in the same edit burst', async (location, limit) => {
  const items = Array.from({ length: limit - 1 }, (_, i) => ({ key: `equipment.${i}`, name: `Item ${i}` }));
  const { queryClient } = makeCache({ id: 'char-1', [location]: items });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => {
    const add = location === 'equipment' ? sheet.editor.addEquipmentItem : sheet.editor.addStorageItem;
    add({ key: 'equipment.last', name: 'Last item' });
    add({ key: 'equipment.overflow', name: 'Overflow item' });
  });
  await wait(SAVE_DELAY);

  expect(server.requests).toHaveLength(1);
  const saved = server.requests[0].body[location] ?? [];
  expect(saved).toHaveLength(limit);
  expect(saved[limit - 1]).toMatchObject({ key: 'equipment.last' });
  expect(sheet.visible()?.[location]).toHaveLength(limit);
  expect(snackbarMocks.showError).toHaveBeenCalled();
});

test('keeps an expired save with its own character while another character is edited', async () => {
  const { queryClient } = makeCache(
    { id: 'a', currentHp: 5, silver: 10 },
    { id: 'b', currentHp: 9, silver: 20 },
  );
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'a' });

  act(() => sheet.editor.updateField('currentHp', 4));
  await wait(SAVE_DELAY);
  await server.rejects(401, { code: 'UNAUTHORIZED' });

  sheet.switchTo({ id: 'b' });
  expect(sheet.editor.saveFailed).toBe(false);
  expect(sheet.visible()).toMatchObject({ id: 'b', currentHp: 9 });
  act(() => sheet.editor.updateField('silver', 21));
  await wait(SAVE_DELAY);
  expect(server.requests[1]).toMatchObject({ id: 'b', body: { silver: 21 } });
  expect(server.requests[1].body).not.toHaveProperty('currentHp');
  await server.saves({ id: 'b', currentHp: 9, silver: 21 });

  sheet.switchTo({ id: 'a' });
  expect(sheet.editor.saveFailed).toBe(true);
  expect(sheet.visible()?.currentHp).toBe(4);
  await perform(() => sheet.editor.retrySave());
  expect(server.requests).toHaveLength(3);
  expect(server.requests[2]).toEqual(server.requests[0]);
});

test('sends the loaded version with a collection edit', async () => {
  const updatedAt = '2026-10-15T09:00:00.000Z';
  const { queryClient } = makeCache({ id: 'char-1', updatedAt, equipment: [] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.addEquipmentItem({ key: 'hammer', name: 'Hammer' }));
  await wait(SAVE_DELAY);

  expect(server.requests[0].body.expectedUpdatedAt).toBe(updatedAt);
});

test('keeps later edits queued after a 401 without retrying until explicit recovery', async () => {
  const { queryClient } = makeCache({ id: 'char-1', currentHp: 5, silver: 10 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('currentHp', 4));
  await wait(SAVE_DELAY);
  await server.rejects(401, { code: 'UNAUTHORIZED' });
  act(() => {
    sheet.editor.updateField('silver', 11);
    sheet.editor.flush();
  });
  await wait(5 * SAVE_DELAY);

  expect(sheet.editor.saveFailed).toBe(true);
  expect(sheet.editor.isSaving).toBe(false);
  expect(server.requests).toHaveLength(1);
  expect(sheet.visible()).toMatchObject({ currentHp: 4, silver: 11 });

  await perform(() => sheet.editor.retrySave());
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1]).toEqual(server.requests[0]);
  await server.saves({ id: 'char-1', currentHp: 4, silver: 10 });
  expect(sheet.editor.saveFailed).toBe(false);
  expect(sheet.visible()).toMatchObject({ currentHp: 4, silver: 11 });

  await wait(SAVE_DELAY);
  expect(server.requests[2].body).toMatchObject({ silver: 11 });
  expect(server.requests[2].body.saveId).not.toBe(server.requests[0].body.saveId);
  await server.rejects(401, { code: 'UNAUTHORIZED' });
  act(() => {
    sheet.editor.updateField('silver', 12);
    sheet.editor.flush();
  });
  sheet.close();
  await wait(5 * SAVE_DELAY);
  expect(server.requests).toHaveLength(3);
});

test.each(['success', 'expired'] as const)('a late %s for the previous scvm cannot alter the active scvm', async (outcome) => {
  const { queryClient, cached } = makeCache({ id: 'a', currentHp: 5 }, { id: 'b', silver: 20 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'a' });

  act(() => sheet.editor.updateField('currentHp', 4));
  await wait(SAVE_DELAY);
  sheet.switchTo({ id: 'b' });
  act(() => sheet.editor.updateField('silver', 21));
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(1);

  if (outcome === 'success') {
    await server.saves({ id: 'a', currentHp: 4 });
  } else {
    await server.rejects(401, { code: 'UNAUTHORIZED' });
  }

  expect(sheet.editor.saveFailed).toBe(false);
  expect(sheet.visible()).toMatchObject({ id: 'b', silver: 21 });
  expect(cached('b')).toMatchObject({ id: 'b', silver: 21 });
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1]).toMatchObject({ id: 'b', body: { silver: 21 } });
  expect(server.requests[1].body).not.toHaveProperty('currentHp');
});

test('a conflict discards stale queued edits and refreshes the authoritative character', async () => {
  const authoritative = { id: 'char-1', updatedAt: '2026-10-15T09:00:09.000Z', equipment: [{ key: 'hammer' }] };
  const { queryClient, watchRefetches } = makeCache({ id: 'char-1', updatedAt: '2026-10-15T09:00:00.000Z', equipment: [] });
  const refetch = watchRefetches('char-1', 'en', () => authoritative);
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.addEquipmentItem({ key: 'rope' }));
  await wait(SAVE_DELAY);
  act(() => sheet.editor.addEquipmentItem({ key: 'sword' }));
  expect(sheet.visible()?.equipment).toEqual([{ key: 'rope' }, { key: 'sword' }]);
  await server.rejects(409, { code: 'STALE_WRITE' });
  await wait(0);

  expect(refetch).toHaveBeenCalledTimes(1);
  expect(snackbarMocks.showError).toHaveBeenCalledWith(expect.stringContaining('another tab'));
  expect(sheet.editor.isSaving).toBe(false);
  expect(sheet.visible()).toEqual(authoritative);

  act(() => sheet.editor.flush());
  await wait(5 * SAVE_DELAY);
  expect(server.requests).toHaveLength(1);
  expect(refetch).toHaveBeenCalledTimes(1);
});

test('REGRESSION: an edit after a newer server copy lands in the cache builds on that copy', async () => {
  const rope = { key: 'rope', name: 'Rope' };
  const hammer = { key: 'hammer', name: 'Hammer' };
  const { queryClient } = makeCache({ id: 'char-1', updatedAt: '2026-10-15T09:00:00.000Z', currentHp: 5, equipment: [] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('currentHp', 4));
  await wait(SAVE_DELAY);
  await server.saves({ id: 'char-1', updatedAt: '2026-10-15T09:00:01.000Z', currentHp: 4, equipment: [] });
  // Getting Better writes its result straight into the cache.
  const improved = { id: 'char-1', updatedAt: '2026-10-15T09:00:02.000Z', currentHp: 9, equipment: [rope] };
  writeCharacter(queryClient, 'char-1', 'en', asCharacter(improved));

  act(() => sheet.editor.addEquipmentItem(hammer));
  await wait(SAVE_DELAY);

  const body = server.requests[1].body;
  expect(body.expectedUpdatedAt).toBe(improved.updatedAt);
  expect(body.equipment).toEqual([rope, hammer]);
  expect(sheet.visible()).toMatchObject({ currentHp: 9, equipment: [rope, hammer] });
});

test('REGRESSION: a queued positional edit is not replayed onto a reordered newer copy', async () => {
  const rope = { key: 'rope', name: 'Rope' };
  const hammer = { key: 'hammer', name: 'Hammer' };
  const { queryClient } = makeCache({ id: 'char-1', updatedAt: '2026-10-15T09:00:00.000Z', equipment: [rope, hammer] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.removeEquipmentItem(1));
  writeCharacter(queryClient, 'char-1', 'en', asCharacter({ id: 'char-1', updatedAt: '2026-10-15T09:00:05.000Z', equipment: [hammer, rope] }));
  act(() => sheet.editor.addEquipmentItem({ key: 'torch', name: 'Torch' }));
  await wait(SAVE_DELAY);

  // The stale version goes out so the server answers 409 instead of deleting the wrong item.
  expect(server.requests[0].body.expectedUpdatedAt).toBe('2026-10-15T09:00:00.000Z');
});

test('REGRESSION: a newer server copy that lands mid-flight is kept over the older save response', async () => {
  const rope = { key: 'rope', name: 'Rope' };
  const { queryClient, cached } = makeCache({ id: 'char-1', updatedAt: '2026-10-15T09:00:00.000Z', currentHp: 5, equipment: [] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('currentHp', 4));
  await wait(SAVE_DELAY);
  const improved = { id: 'char-1', updatedAt: '2026-10-15T09:00:02.000Z', currentHp: 9, equipment: [rope] };
  writeCharacter(queryClient, 'char-1', 'en', asCharacter(improved));
  await server.saves({ id: 'char-1', updatedAt: '2026-10-15T09:00:01.000Z', currentHp: 4, equipment: [] });

  expect(cached('char-1')).toEqual(improved);
  expect(sheet.visible()).toEqual(improved);
  act(() => sheet.editor.addEquipmentItem({ key: 'hammer', name: 'Hammer' }));
  await wait(SAVE_DELAY);
  expect(server.requests[1].body.expectedUpdatedAt).toBe(improved.updatedAt);
});

test('REGRESSION: a save whose response was lost is resent unchanged, and later edits wait for the next save', async () => {
  const hammer = { key: 'hammer', name: 'Hammer' };
  const torch = { key: 'torch', name: 'Torch' };
  const { queryClient } = makeCache({ id: 'char-1', updatedAt: '2026-10-16T09:00:00.000Z', equipment: [] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.addEquipmentItem(hammer));
  await wait(SAVE_DELAY);
  await server.dropsConnection();
  act(() => sheet.editor.addEquipmentItem(torch));
  await wait(SAVE_DELAY);

  const first = server.requests[0];
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1]).toEqual(first);
  expect(sheet.visible()?.equipment).toEqual([hammer, torch]);

  // The server recognises the save id and reads the character back.
  await server.saves({ id: 'char-1', updatedAt: '2026-10-16T09:00:01.000Z', equipment: [hammer] });
  expect(sheet.visible()?.equipment).toEqual([hammer, torch]);
  await wait(SAVE_DELAY);
  const next = server.requests[2].body;
  expect(next.equipment).toEqual([hammer, torch]);
  expect(next.expectedUpdatedAt).toBe('2026-10-16T09:00:01.000Z');
  expect(next.saveId).not.toBe(first.body.saveId);
});

test('queues patches and applies them optimistically to the cache', async () => {
  const { queryClient, cached } = makeCache({ id: 'char-1', name: 'Old' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'New Name'));

  expect(cached('char-1')).toEqual({ id: 'char-1', name: 'New Name' });
  expect(sheet.visible()).toEqual({ id: 'char-1', name: 'New Name' });
  expect(sheet.editor.isSaving).toBe(true);
  await wait(SAVE_DELAY - 1);
  expect(server.requests).toHaveLength(0);
});

test('warns on reload while an edit is queued or saving, then stops after it is saved', async () => {
  const { queryClient } = makeCache({ id: 'char-1', habit: 'Old habit' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });
  const attemptsToLeave = () => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };

  expect(attemptsToLeave()).toBe(false);
  act(() => sheet.editor.updateField('habit', 'Pending habit'));
  expect(attemptsToLeave()).toBe(true);
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(1);
  expect(attemptsToLeave()).toBe(true);
  await server.saves({ id: 'char-1', habit: 'Pending habit' });
  expect(attemptsToLeave()).toBe(false);
});

test('flushes the queued patch to the server', async () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'Old' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'New Name'));
  await perform(() => sheet.editor.flush());

  expect(server.requests).toEqual([
    { id: 'char-1', locale: 'en', body: { name: 'New Name', saveId: expect.any(String) } },
  ]);
});

test('rejects invalid simple fields and keeps them out of the save queue', async () => {
  const { queryClient, cached } = makeCache({ id: 'char-1', silver: 10 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('silver', 1000001));

  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Silver must be between 0 and 1000000'
  );
  expect(cached('char-1')).toEqual({ id: 'char-1', silver: 10 });
  expect(sheet.editor.isSaving).toBe(false);
  await perform(() => sheet.editor.flush());
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(0);

  act(() => sheet.editor.updateField('silver', 20));
  expect(cached('char-1')).toEqual({ id: 'char-1', silver: 20 });
  await wait(SAVE_DELAY);
  expect(server.requests.map((request) => request.body)).toEqual([
    { silver: 20, saveId: expect.any(String) },
  ]);
});

test('serializes flushes and builds each from the latest optimistic state', async () => {
  const sword = { key: 'sword', name: 'Sword' };
  const torch = { key: 'torch', name: 'Torch' };
  const loaded = { id: 'char-1', equipment: [], storage: [], equippedWeapons: [], equippedArmor: null, modifiers: [] };
  const { queryClient } = makeCache(loaded);
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.addEquipmentItem(sword));
  await wait(SAVE_DELAY);
  act(() => sheet.editor.addEquipmentItem(torch));
  await perform(() => sheet.editor.flush());
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(1);

  await server.saves({ ...loaded, equipment: [sword] });
  await wait(SAVE_DELAY);

  expect(server.requests).toHaveLength(2);
  expect(server.requests[0].body).toMatchObject({ equipment: [sword] });
  expect(server.requests[1].body).toMatchObject({ equipment: [sword, torch] });
});

test('REGRESSION: does not lose an edit queued while a save is in flight', async () => {
  const { queryClient, cached } = makeCache({ id: 'char-1', name: 'A0', silver: 0 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A'));
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(1);

  act(() => sheet.editor.updateField('silver', 20));
  // The first save settles with a server copy that predates the second edit.
  await server.saves({ id: 'char-1', name: 'A', silver: 0 });

  expect(sheet.editor.isSaving).toBe(true);
  expect(cached('char-1')).toEqual({ id: 'char-1', name: 'A', silver: 20 });
  expect(sheet.visible()).toEqual({ id: 'char-1', name: 'A', silver: 20 });

  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1].body).toMatchObject({ silver: 20 });
  await server.saves({ id: 'char-1', name: 'A', silver: 20 });
  expect(sheet.editor.isSaving).toBe(false);
});

test('REGRESSION: language switches before flush keep queued equipment visible and saveable', async () => {
  const torch = { key: 'equipment.torch', name: 'Torch' };
  const loaded = { id: 'char-1', equipment: [], storage: [], equippedWeapons: [], equippedArmor: null, modifiers: [] };
  const { queryClient } = makeCache(loaded);
  writeCharacter(queryClient, 'char-1', 'pl', asCharacter(loaded));
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1', locale: 'en' });

  act(() => sheet.editor.addEquipmentItem(torch));
  sheet.switchTo({ locale: 'pl' });

  expect(sheet.visible()?.equipment).toEqual([torch]);

  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(1);
  expect(server.requests[0]).toMatchObject({ locale: 'pl', body: { equipment: [torch] } });
});

test('REGRESSION: stale localized refetches do not hide a newer saved character', async () => {
  const torch = { key: 'equipment.torch', name: 'Torch' };
  const loaded = {
    id: 'char-1',
    equipment: [],
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    modifiers: [],
    updatedAt: '2026-06-24T10:00:00.000Z',
  };
  const { queryClient } = makeCache(loaded);
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.addEquipmentItem(torch));
  await wait(SAVE_DELAY);
  await server.saves({ ...loaded, equipment: [torch], updatedAt: '2026-06-24T10:00:05.000Z' });
  // A refetch that started before the save answers after it, with the older copy.
  writeCharacter(queryClient, 'char-1', 'en', asCharacter({ ...loaded, updatedAt: '2026-06-24T10:00:01.000Z' }));

  expect(sheet.visible()?.equipment).toEqual([torch]);
});

test('REGRESSION: auto-retries a transient 5xx instead of dropping the edit', async () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'A0' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A'));
  await wait(SAVE_DELAY);
  await server.rejects(500, { code: 'INTERNAL_ERROR' });

  expect(snackbarMocks.showError).not.toHaveBeenCalled();
  expect(errorFeedbackMocks.showUnexpectedError).not.toHaveBeenCalled();
  expect(sheet.editor.isSaving).toBe(true);
  expect(sheet.editor.saveFailed).toBe(false);
  expect(sheet.visible()).toEqual({ id: 'char-1', name: 'A' });

  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1]).toEqual(server.requests[0]);
  await server.saves({ id: 'char-1', name: 'A' });
  expect(sheet.editor.isSaving).toBe(false);
});

test('reports repeated 5xx saves after the retry tolerance and keeps a manual retry', async () => {
  const { queryClient } = makeCache({ id: 'char-1' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });
  const serverError = {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Unexpected error occurred.',
  };

  act(() => sheet.editor.updateField('currentHp', 10));
  await wait(SAVE_DELAY);
  await server.rejects(500, serverError);
  await wait(SAVE_DELAY);
  await server.rejects(500, serverError);
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(3);
  expect(errorFeedbackMocks.showUnexpectedError).not.toHaveBeenCalled();
  expect(snackbarMocks.showError).not.toHaveBeenCalled();

  await server.rejects(500, serverError);

  expect(errorFeedbackMocks.showUnexpectedError).toHaveBeenCalledWith(
    serverError,
    expect.objectContaining({
      source: 'character_save',
      operation: 'patch_character',
      characterId: 'char-1',
    })
  );
  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Unexpected error occurred.',
    expect.objectContaining({ label: 'Retry', onClick: expect.any(Function) })
  );
  expect(sheet.editor.isSaving).toBe(false);
  expect(sheet.editor.saveFailed).toBe(true);
  await wait(5 * SAVE_DELAY);
  expect(server.requests).toHaveLength(3);

  await perform(() => sheet.editor.retrySave());
  expect(sheet.editor.saveFailed).toBe(false);
  expect(sheet.editor.isSaving).toBe(true);
  expect(server.requests).toHaveLength(4);
  expect(server.requests[3]).toEqual(server.requests[0]);
  expect(server.requests[3].body).toMatchObject({ currentHp: 10 });

  await server.saves({ id: 'char-1', currentHp: 10 });
  expect(sheet.editor.saveFailed).toBe(false);
  expect(sheet.editor.isSaving).toBe(false);
});

test('a deleted character discards all queued edits and stale visible snapshots', async () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'Original' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });
  const notFound = { statusCode: 404, code: 'CHARACTER_NOT_FOUND' };

  act(() => sheet.editor.updateField('name', 'Saved before deletion'));
  await wait(SAVE_DELAY);
  await server.saves({ id: 'char-1', name: 'Saved before deletion', updatedAt: '2026-10-15T10:00:00Z' });
  expect(sheet.editor.missingCharacterError).toBeNull();
  act(() => sheet.editor.updateField('name', 'Rejected edit'));
  await wait(SAVE_DELAY);
  act(() => sheet.editor.updateField('currentHp', 1));
  await server.rejects(404, notFound);

  expect(sheet.editor.isSaving).toBe(false);
  expect(sheet.editor.missingCharacterError).toEqual(notFound);
  expect(sheet.editor.getVisibleCharacter(undefined)).toBeUndefined();
  act(() => sheet.editor.flush());
  await wait(5 * SAVE_DELAY);
  expect(server.requests).toHaveLength(2);
  expect(snackbarMocks.showError).not.toHaveBeenCalled();

  const surviving = asCharacter({ id: 'char-2', name: 'Survivor', updatedAt: '2026-10-14T10:00:00Z' });
  expect(sheet.editor.getVisibleCharacter(surviving)).toBe(surviving);
  sheet.switchTo({ id: 'char-2' });
  expect(sheet.editor.missingCharacterError).toBeNull();
});

test('shows the confirmed party membership, not the optimistic copy, while edits are queued', () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'A0', partyId: 'party-old' });
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A1'));
  expect(sheet.visible()?.partyId).toBe('party-old');

  queryClient.setQueryData(
    ['get', '/api/characters/{id}', { params: { path: { id: 'char-1' }, query: { locale: 'en' } } }],
    asCharacter({ id: 'char-1', name: 'A0', partyId: null, updatedAt: '2026-10-15T10:00:00Z' }),
  );
  expect(sheet.visible()?.name).toBe('A1');
  expect(sheet.visible()?.partyId).toBeNull();
});

test('drops the batch on a terminal client (4xx) error without retrying it', async () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'A0' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A'));
  await wait(SAVE_DELAY);
  await server.rejects(400, { message: 'Bad' });

  expect(sheet.editor.isSaving).toBe(false);
  expect(sheet.editor.saveFailed).toBe(false);
  expect(snackbarMocks.showError).toHaveBeenCalledWith('Bad');
  await wait(5 * SAVE_DELAY);
  expect(server.requests).toHaveLength(1);
});

test('a 4xx restores the copy the sheet held when the save was sent, with later edits on top', async () => {
  const { queryClient, cached } = makeCache({ id: 'char-1', name: 'A0', silver: 0 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A'));
  await wait(SAVE_DELAY);
  act(() => sheet.editor.updateField('silver', 20));
  writeCharacter(queryClient, 'char-1', 'en', asCharacter({ id: 'char-1', name: 'Written mid-flight', silver: 7 }));
  await server.rejects(400, { message: 'Bad' });

  // The pre-save snapshot is taken as the request leaves, after the edit was applied
  // optimistically, so the rejected edit ('A') is part of it and stays on screen.
  expect(cached('char-1')).toEqual({ id: 'char-1', name: 'A', silver: 20 });
  expect(sheet.visible()).toEqual({ id: 'char-1', name: 'A', silver: 20 });
  expect(sheet.editor.isSaving).toBe(true);

  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1].body).toEqual({ silver: 20, saveId: expect.any(String) });
});

test('writes the server response into the cache on success (no extra refetch)', async () => {
  const { queryClient, cached, watchRefetches } = makeCache();
  writeCharacter(queryClient, 'char-1', 'pl', asCharacter({ id: 'char-1', equipment: [] }));
  const refetchSavedCopy = watchRefetches('char-1', 'pl');
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1', locale: 'pl' });

  act(() => sheet.editor.addEquipmentItem({ key: 'torch', name: 'Torch' }));
  await wait(SAVE_DELAY);
  expect(server.requests[0].locale).toBe('pl');
  const serverCopy = {
    id: 'char-1',
    equipment: [{ key: 'torch', name: 'Torch', uses: [true, true] }],
  };
  await server.saves(serverCopy);
  await wait(5 * SAVE_DELAY);

  expect(trackCharacterEdited).toHaveBeenCalledWith(
    [expect.objectContaining({ kind: 'equipment-add' })],
    'pl'
  );
  expect(cached('char-1', 'pl')).toEqual(serverCopy);
  expect(sheet.visible()).toEqual(serverCopy);
  expect(refetchSavedCopy).not.toHaveBeenCalled();
});

test.each(['saved', 'rejected', 'lost'] as const)('REGRESSION: a %s save marks the lists stale for their next read but never the saved character', async (outcome) => {
  const { queryClient, isStale, watchRefetches } = makeCache({ id: 'char-1', silver: 0 });
  writeCharacter(queryClient, 'char-1', 'pl', asCharacter({ id: 'char-1', silver: 0 }));
  const apiListKey = [...characterRosterKey(), { params: { query: { locale: 'en' } } }];
  queryClient.setQueryData(ownedCharactersKey, []);
  queryClient.setQueryData(apiListKey, []);
  const refetchList = vi.fn(async () => []);
  new QueryObserver(queryClient, { queryKey: apiListKey, queryFn: refetchList, staleTime: Infinity }).subscribe(() => {});
  const refetchSavedCopy = watchRefetches('char-1', 'en');
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('silver', 5));
  await wait(SAVE_DELAY);
  expect(isStale(ownedCharactersKey)).toBe(false);
  if (outcome === 'saved') {
    await server.saves({ id: 'char-1', silver: 5 });
  } else if (outcome === 'rejected') {
    await server.rejects(400, { message: 'Bad' });
  } else {
    await server.dropsConnection();
  }

  expect(isStale(ownedCharactersKey)).toBe(true);
  expect(isStale(apiListKey)).toBe(true);
  expect(refetchList).not.toHaveBeenCalled();
  expect(isStale(characterDetailKey('char-1', 'en'))).toBe(false);
  expect(refetchSavedCopy).not.toHaveBeenCalled();
  expect(isStale(characterDetailKey('char-1', 'pl'))).toBe(outcome === 'saved');
});

test('a save cancels a fetch of the character that is in flight, so its late answer cannot overwrite the edit', async () => {
  const { queryClient, cached } = makeCache({ id: 'char-1', silver: 0 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });
  let answerFetch: (character: CharacterResponse) => void = () => {};
  void queryClient.fetchQuery({
    queryKey: characterDetailKey('char-1', 'en'),
    queryFn: () => new Promise<CharacterResponse>((resolve) => { answerFetch = resolve; }),
  });
  const fetchStatus = () => queryClient.getQueryState(characterDetailKey('char-1', 'en'))?.fetchStatus;

  act(() => sheet.editor.updateField('silver', 5));
  expect(fetchStatus()).toBe('fetching');
  await wait(SAVE_DELAY);

  expect(server.requests).toHaveLength(1);
  expect(fetchStatus()).toBe('idle');
  answerFetch(asCharacter({ id: 'char-1', silver: 0 }));
  await wait(0);
  expect(cached('char-1')).toEqual({ id: 'char-1', silver: 5 });
  expect(sheet.visible()).toEqual({ id: 'char-1', silver: 5 });
});

test('REGRESSION: after a save in one language, switching language shows that language', async () => {
  const { queryClient, isStale, watchRefetches } = makeCache({ id: 'char-1', updatedAt: '2026-10-16T09:00:00.000Z', silver: 0, trait1: 'egocentric' });
  writeCharacter(queryClient, 'char-1', 'pl', asCharacter({ id: 'char-1', updatedAt: '2026-10-16T09:00:00.000Z', silver: 0, trait1: 'egocentryczny' }));
  const refetchSavedCopy = watchRefetches('char-1', 'pl');
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1', locale: 'pl' });

  act(() => sheet.editor.updateField('silver', 5));
  await wait(SAVE_DELAY);
  await server.saves({
    id: 'char-1',
    updatedAt: '2026-10-16T09:00:01.000Z',
    silver: 5,
    trait1: 'egocentryczny',
  });
  expect(isStale(characterDetailKey('char-1', 'en'))).toBe(true);
  expect(refetchSavedCopy).not.toHaveBeenCalled();

  sheet.switchTo({ locale: 'en' });
  expect(sheet.visible()?.trait1).toBe('egocentric');

  act(() => sheet.editor.updateField('silver', 6));
  expect(sheet.visible()).toMatchObject({
    silver: 6,
    trait1: 'egocentric',
  });
});

test('surfaces rate limits without a retry action and keeps the edit queued', async () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'A0', silver: 0 });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A'));
  await wait(SAVE_DELAY);
  await server.rejects(429, { code: 'RATE_LIMITED' });

  expect(snackbarMocks.showError).toHaveBeenCalledTimes(1);
  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Too many requests. Please try again later.'
  );
  expect(sheet.editor.isSaving).toBe(true);
  expect(sheet.visible()).toMatchObject({ name: 'A' });
  await wait(5 * SAVE_DELAY);
  expect(server.requests).toHaveLength(1);

  act(() => sheet.editor.updateField('silver', 3));
  await wait(SAVE_DELAY);
  expect(server.requests).toHaveLength(2);
  expect(server.requests[1].body).toMatchObject({ name: 'A', silver: 3 });
});

test('REGRESSION: flushes a pending edit on unmount instead of dropping it', async () => {
  const { queryClient } = makeCache({ id: 'char-1', name: 'A0' });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => sheet.editor.updateField('name', 'A'));
  await wait(SAVE_DELAY / 2);
  expect(server.requests).toHaveLength(0);

  sheet.close();
  await wait(0);

  expect(server.requests.map((request) => request.body)).toEqual([
    { name: 'A', saveId: expect.any(String) },
  ]);
});

test('supports equipment, storage, and modifier operations end to end', async () => {
  const sword = { key: 'sword', name: 'Sword' };
  const potion = { key: 'potion', name: 'Potion' };
  const { queryClient } = makeCache({ id: 'char-1', equipment: [], storage: [], modifiers: [] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1' });

  act(() => {
    sheet.editor.addEquipmentItem(sword);
    sheet.editor.addStorageItem(potion);
    sheet.editor.addModifier({ id: 'mod-1', name: 'Bonus', statistic: 'strength', value: 1 });
    sheet.editor.updateModifier('mod-1', { value: 2 });
  });
  await wait(SAVE_DELAY);

  expect(server.requests).toHaveLength(1);
  expect(server.requests[0].body).toMatchObject({
    equipment: [sword],
    storage: [potion],
    modifiers: [expect.objectContaining({ id: 'mod-1', name: 'Bonus', value: 2 })],
  });
  expect(sheet.visible()).toMatchObject({
    equipment: [sword],
    storage: [potion],
    modifiers: [expect.objectContaining({ id: 'mod-1', value: 2 })],
  });
});

test('a read-only sheet shows no edit and saves nothing', async () => {
  const { queryClient, cached } = makeCache({ id: 'char-1', name: 'Shared', equipment: [] });
  const server = fakeServer();
  const sheet = openSheet(queryClient, { id: 'char-1', readOnly: true });

  act(() => {
    sheet.editor.updateField('name', 'Edited');
    sheet.editor.addEquipmentItem({ key: 'rope', name: 'Rope' });
    sheet.editor.flush();
  });
  await wait(SAVE_DELAY);
  sheet.close();
  await wait(SAVE_DELAY);

  expect(cached('char-1')).toEqual({ id: 'char-1', name: 'Shared', equipment: [] });
  expect(sheet.editor.isSaving).toBe(false);
  expect(server.requests).toHaveLength(0);
});
