import type { QueryClient } from '@tanstack/react-query';
import type { CharacterResponse } from '@/hooks/models';
import { API_LOCALES, getApiLocale } from '@/hooks/utils';

/**
 * The one owner of the character entries in the TanStack Query cache. Key shapes
 * and locale normalisation live here only: callers pass whatever i18n language
 * they hold (`en-US`, `pl`, undefined) and never compose a character key.
 */

const DETAIL_PATH = '/api/characters/{id}';

type CharacterWrite =
  | CharacterResponse
  | undefined
  | ((cached: CharacterResponse | undefined) => CharacterResponse | undefined);

type StaleScope = { locale: string | undefined } | { exceptLocale: string | undefined };

/** Key of the detail entry `$api` fills for `GET /api/characters/{id}` in the language's API locale. */
export const characterDetailKey = (id: string, language?: string) =>
  ['get', DETAIL_PATH, { params: { path: { id }, query: { locale: getApiLocale(language) } } }] as const;

/** Prefix shared by the `$api` character lists of every locale (saved-characters page, party roster). */
export const characterRosterKey = () => ['get', '/api/characters'] as const;

/**
 * Key of the raw-fetch "does this session already own characters?" list. The
 * first-run bootstrap and the guest creation flow share it so the call is deduped.
 */
export const ownedCharactersKey = ['characters', 'list'] as const;

/** The cached copy of a character in the language's locale, if there is one. */
export function readCharacter(
  queryClient: QueryClient,
  id: string,
  language: string | undefined,
): CharacterResponse | undefined {
  return queryClient.getQueryData<CharacterResponse>(characterDetailKey(id, language));
}

/** Stores a character, or the result of updating the cached one, as that locale's copy. Never refetches. */
export function writeCharacter(
  queryClient: QueryClient,
  id: string,
  language: string | undefined,
  character: CharacterWrite,
): void {
  queryClient.setQueryData<CharacterResponse>(characterDetailKey(id, language), character);
}

/** Stores a character the server just created and marks the lists stale, since they do not hold it yet. */
export function seedCreatedCharacter(
  queryClient: QueryClient,
  id: string,
  language: string | undefined,
  character: CharacterResponse,
): void {
  writeCharacter(queryClient, id, language, character);
  markCharacterListsStale(queryClient);
}

/** Removes that locale's copy of a character that is gone (deleted, or no longer readable). */
export function dropCharacter(
  queryClient: QueryClient,
  id: string,
  language: string | undefined,
): void {
  queryClient.removeQueries({ queryKey: characterDetailKey(id, language) });
}

/** Cancels in-flight fetches of that copy so a late response cannot overwrite an optimistic write. */
export function cancelCharacterFetches(
  queryClient: QueryClient,
  id: string,
  language: string | undefined,
): Promise<void> {
  return queryClient.cancelQueries({ queryKey: characterDetailKey(id, language) });
}

/**
 * Marks both character lists stale. Never touches a detail entry.
 * With `'now'` the lists on screen refetch at once. With `'on-next-read'` they
 * refetch only when next mounted: a save uses it, because the header's party
 * roster is always mounted and would otherwise turn every PATCH into a list GET too.
 */
export function markCharacterListsStale(
  queryClient: QueryClient,
  refetch: 'now' | 'on-next-read' = 'now',
): void {
  const refetchType = refetch === 'now' ? 'active' : 'none';
  void queryClient.invalidateQueries({ queryKey: ownedCharactersKey, refetchType });
  void queryClient.invalidateQueries({ queryKey: characterRosterKey(), refetchType });
}

/**
 * Marks a character's cached copies stale so the ones on screen refetch: every
 * locale by default, one with `locale`, all but one with `exceptLocale`.
 * A save must not mark the locale it saved: the editor reconciles that copy
 * from the PATCH response, and a refetch would race its queued edits.
 */
export function markCharacterStale(
  queryClient: QueryClient,
  id: string,
  scope?: StaleScope,
): void {
  if (!scope) {
    void queryClient.invalidateQueries({
      queryKey: ['get', DETAIL_PATH, { params: { path: { id } } }],
    });
    return;
  }

  const locales =
    'locale' in scope
      ? [getApiLocale(scope.locale)]
      : API_LOCALES.filter((locale) => locale !== getApiLocale(scope.exceptLocale));
  for (const locale of locales) {
    void queryClient.invalidateQueries({
      queryKey: characterDetailKey(id, locale),
      exact: true,
    });
  }
}
