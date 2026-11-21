import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { $api, type ApiLocale } from '@/api';
import {
  cancelCharacterFetches,
  characterDetailKey,
  characterRosterKey,
  dropCharacter,
  markCharacterListsStale,
  markCharacterStale,
  ownedCharactersKey,
  readCharacter,
  seedCreatedCharacter,
  writeCharacter,
} from '@/api/characterCache';

const scvm = { id: 'char-1', name: 'Grittr', currentHp: 4 };

/** The key `$api.useQuery` gives the detail request the sheet and the warband cards make. */
const detailRequestKey = (id: string, locale: ApiLocale) =>
  $api.queryOptions('get', '/api/characters/{id}', {
    params: { path: { id }, query: { locale } },
  }).queryKey;

/** The key `$api.useQuery` gives the list request the saved-characters page and the party roster make. */
const listRequestKey = (locale: ApiLocale) =>
  $api.queryOptions('get', '/api/characters', { params: { query: { locale } } }).queryKey;

const isStale = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated;

/** Mounts a reader of an entry, as an open page does, and returns the spy counting its refetches. */
function watchRefetches(queryClient: QueryClient, queryKey: readonly unknown[]) {
  const refetch = vi.fn(async () => queryClient.getQueryData(queryKey) ?? null);
  new QueryObserver(queryClient, { queryKey, queryFn: refetch, staleTime: Infinity }).subscribe(
    () => {}
  );
  return refetch;
}

/** A cache holding both lists, the header count and both locale copies of two characters. */
function filledCache() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(ownedCharactersKey, [scvm]);
  queryClient.setQueryData(listRequestKey('en'), [scvm]);
  queryClient.setQueryData(listRequestKey('pl'), [scvm]);
  queryClient.setQueryData(['get', '/api/characters/count'], { count: 1 });
  for (const id of ['char-1', 'char-2']) {
    writeCharacter(queryClient, id, 'en', { ...scvm, id });
    writeCharacter(queryClient, id, 'pl', { ...scvm, id });
  }
  return queryClient;
}

describe('character cache', () => {
  describe('locale', () => {
    it.each([
      ['en-US', 'en'],
      ['pl-PL', 'pl'],
      [undefined, 'en'],
      ['de', 'en'],
    ] as const)('stores a character written under %s where the %s sheet reads it', (language, locale) => {
      const queryClient = new QueryClient();

      writeCharacter(queryClient, scvm.id, language, scvm);

      expect(readCharacter(queryClient, scvm.id, locale)).toEqual(scvm);
      expect(queryClient.getQueryData(detailRequestKey(scvm.id, locale))).toEqual(scvm);
    });

    it('keeps each locale its own copy', () => {
      const queryClient = new QueryClient();

      writeCharacter(queryClient, scvm.id, 'en', { ...scvm, trait1: 'egocentric' });
      writeCharacter(queryClient, scvm.id, 'pl', { ...scvm, trait1: 'egocentryczny' });

      expect(readCharacter(queryClient, scvm.id, 'en-GB')?.trait1).toBe('egocentric');
      expect(readCharacter(queryClient, scvm.id, 'pl-PL')?.trait1).toBe('egocentryczny');
    });

    it('hands out the detail key the `$api` request uses', () => {
      expect(characterDetailKey(scvm.id, 'pl-PL')).toEqual(detailRequestKey(scvm.id, 'pl'));
    });
  });

  describe('writeCharacter', () => {
    it('updates the cached copy from its previous value', () => {
      const queryClient = new QueryClient();
      writeCharacter(queryClient, scvm.id, 'en', scvm);

      writeCharacter(queryClient, scvm.id, 'en', (cached) =>
        cached ? { ...cached, currentHp: 1 } : undefined
      );

      expect(readCharacter(queryClient, scvm.id, 'en')).toEqual({ ...scvm, currentHp: 1 });
    });

    it('leaves the lists and the written copy fresh', () => {
      const queryClient = filledCache();

      writeCharacter(queryClient, scvm.id, 'en', { ...scvm, currentHp: 1 });

      expect(isStale(queryClient, ownedCharactersKey)).toBe(false);
      expect(isStale(queryClient, listRequestKey('en'))).toBe(false);
      expect(isStale(queryClient, detailRequestKey(scvm.id, 'en'))).toBe(false);
    });
  });

  describe('seedCreatedCharacter', () => {
    it('makes a character created under en-US readable under en', () => {
      const queryClient = new QueryClient();

      seedCreatedCharacter(queryClient, scvm.id, 'en-US', scvm);

      expect(readCharacter(queryClient, scvm.id, 'en')).toEqual(scvm);
    });

    it('marks both lists stale, since neither holds the new character', () => {
      const queryClient = filledCache();

      seedCreatedCharacter(queryClient, 'char-3', 'en', { ...scvm, id: 'char-3' });

      expect(isStale(queryClient, ownedCharactersKey)).toBe(true);
      expect(isStale(queryClient, listRequestKey('en'))).toBe(true);
      expect(isStale(queryClient, listRequestKey('pl'))).toBe(true);
      expect(isStale(queryClient, detailRequestKey('char-3', 'en'))).toBe(false);
    });
  });

  describe('dropCharacter', () => {
    it('removes a deleted character from the normalised locale and nothing else', () => {
      const queryClient = filledCache();

      dropCharacter(queryClient, 'char-1', 'pl-PL');

      expect(readCharacter(queryClient, 'char-1', 'pl')).toBeUndefined();
      expect(readCharacter(queryClient, 'char-1', 'en')).toBeDefined();
      expect(readCharacter(queryClient, 'char-2', 'pl')).toBeDefined();
      expect(queryClient.getQueryData(listRequestKey('pl'))).toEqual([scvm]);
    });
  });

  describe('cancelCharacterFetches', () => {
    it('cancels an in-flight fetch of that copy and keeps the cached character', async () => {
      const queryClient = new QueryClient();
      writeCharacter(queryClient, scvm.id, 'en', scvm);
      const fetchStatus = () =>
        queryClient.getQueryState(detailRequestKey(scvm.id, 'en'))?.fetchStatus;
      void queryClient
        .fetchQuery({
          queryKey: detailRequestKey(scvm.id, 'en'),
          queryFn: () => new Promise<typeof scvm>(() => {}),
          staleTime: 0,
        })
        .catch(() => undefined);
      expect(fetchStatus()).toBe('fetching');

      await cancelCharacterFetches(queryClient, scvm.id, 'en-US');

      expect(fetchStatus()).toBe('idle');
      expect(readCharacter(queryClient, scvm.id, 'en')).toEqual(scvm);
    });

    it('leaves a fetch of another locale running', async () => {
      const queryClient = new QueryClient();
      void queryClient
        .fetchQuery({
          queryKey: detailRequestKey(scvm.id, 'pl'),
          queryFn: () => new Promise<typeof scvm>(() => {}),
        })
        .catch(() => undefined);

      await cancelCharacterFetches(queryClient, scvm.id, 'en');

      expect(queryClient.getQueryState(detailRequestKey(scvm.id, 'pl'))?.fetchStatus).toBe('fetching');
    });
  });

  describe('markCharacterListsStale', () => {
    it('marks the bootstrap list and every `$api` list stale', () => {
      const queryClient = filledCache();

      markCharacterListsStale(queryClient);

      expect(isStale(queryClient, ownedCharactersKey)).toBe(true);
      expect(isStale(queryClient, listRequestKey('en'))).toBe(true);
      expect(isStale(queryClient, listRequestKey('pl'))).toBe(true);
    });

    it('REGRESSION: never marks a character detail entry stale, so a save cannot trigger a detail refetch', () => {
      const queryClient = filledCache();

      markCharacterListsStale(queryClient);

      for (const id of ['char-1', 'char-2']) {
        expect(isStale(queryClient, detailRequestKey(id, 'en'))).toBe(false);
        expect(isStale(queryClient, detailRequestKey(id, 'pl'))).toBe(false);
      }
      expect(isStale(queryClient, ['get', '/api/characters/count'])).toBe(false);
    });

    it('REGRESSION: refetches the open lists but not the open sheet', () => {
      const queryClient = filledCache();
      const refetchBootstrapList = watchRefetches(queryClient, ownedCharactersKey);
      const refetchRoster = watchRefetches(queryClient, listRequestKey('en'));
      const refetchSheet = watchRefetches(queryClient, detailRequestKey('char-1', 'en'));

      markCharacterListsStale(queryClient);

      expect(refetchBootstrapList).toHaveBeenCalledTimes(1);
      expect(refetchRoster).toHaveBeenCalledTimes(1);
      expect(refetchSheet).not.toHaveBeenCalled();
    });

    it('REGRESSION: with on-next-read marks the lists stale without refetching the open ones, so a save costs no list request', () => {
      const queryClient = filledCache();
      const refetchBootstrapList = watchRefetches(queryClient, ownedCharactersKey);
      const refetchRoster = watchRefetches(queryClient, listRequestKey('en'));

      markCharacterListsStale(queryClient, 'on-next-read');

      expect(refetchBootstrapList).not.toHaveBeenCalled();
      expect(refetchRoster).not.toHaveBeenCalled();
      expect(isStale(queryClient, ownedCharactersKey)).toBe(true);
      expect(isStale(queryClient, listRequestKey('en'))).toBe(true);
      expect(isStale(queryClient, listRequestKey('pl'))).toBe(true);
      expect(isStale(queryClient, detailRequestKey('char-1', 'en'))).toBe(false);
    });

    it('marks the lists the party code addresses by the roster key', () => {
      const queryClient = filledCache();

      void queryClient.invalidateQueries({ queryKey: characterRosterKey() });

      expect(isStale(queryClient, listRequestKey('en'))).toBe(true);
      expect(isStale(queryClient, listRequestKey('pl'))).toBe(true);
      expect(isStale(queryClient, ownedCharactersKey)).toBe(false);
      expect(isStale(queryClient, detailRequestKey('char-1', 'en'))).toBe(false);
    });
  });

  describe('markCharacterStale', () => {
    it('marks every locale copy of that character stale by default', () => {
      const queryClient = filledCache();

      markCharacterStale(queryClient, 'char-1');

      expect(isStale(queryClient, detailRequestKey('char-1', 'en'))).toBe(true);
      expect(isStale(queryClient, detailRequestKey('char-1', 'pl'))).toBe(true);
    });

    it('marks only the named locale with `locale`', () => {
      const queryClient = filledCache();

      markCharacterStale(queryClient, 'char-1', { locale: 'en-US' });

      expect(isStale(queryClient, detailRequestKey('char-1', 'en'))).toBe(true);
      expect(isStale(queryClient, detailRequestKey('char-1', 'pl'))).toBe(false);
    });

    it('spares the named locale with `exceptLocale`, so the copy a save reconciled is not refetched', () => {
      const queryClient = filledCache();

      markCharacterStale(queryClient, 'char-1', { exceptLocale: 'pl-PL' });

      expect(isStale(queryClient, detailRequestKey('char-1', 'pl'))).toBe(false);
      expect(isStale(queryClient, detailRequestKey('char-1', 'en'))).toBe(true);
    });

    it.each([
      ['every locale', undefined],
      ['one locale', { locale: 'en' }],
      ['the other locales', { exceptLocale: 'en' }],
    ] as const)('leaves other characters and the lists fresh when marking %s', (_label, scope) => {
      const queryClient = filledCache();

      markCharacterStale(queryClient, 'char-1', scope);

      expect(isStale(queryClient, detailRequestKey('char-2', 'en'))).toBe(false);
      expect(isStale(queryClient, detailRequestKey('char-2', 'pl'))).toBe(false);
      expect(isStale(queryClient, ownedCharactersKey)).toBe(false);
      expect(isStale(queryClient, listRequestKey('en'))).toBe(false);
    });
  });
});
