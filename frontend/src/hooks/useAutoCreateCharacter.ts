import { useEffect, useState, type MutableRefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import {
  charactersListQueryKey,
  fetchCharacterList,
} from '@/hooks/charactersListQuery';
import {
  getUserFacingApiErrorMessage,
  isUnexpectedApiError,
} from '@/utils/errorUtils';

type CreateMutation = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches the $api mutation surface
  mutate: (vars: any, options?: any) => void;
  data?: { id?: string } | null;
};

type ReportUnexpectedError = (
  error: unknown,
  context: { source: string; operation: string; locale: string },
  fallbackMessage: string
) => void;

type Params = {
  pathname: string;
  authLoading: boolean;
  characterId: string | null;
  isJustLoggedOut: boolean;
  isSessionExpired: boolean;
  createCharacter: CreateMutation;
  setCharacterId: (id: string | null) => void;
  trimmedLocale: string;
  queryClient: QueryClient;
  controllerRef: MutableRefObject<AbortController | null>;
  reportUnexpectedError: ReportUnexpectedError;
  showError: (message: string) => void;
  t: (key: string, fallback: string) => string;
};

/**
 * Owns the first-run flow: on the `/character` route with no active character,
 * select an existing one if the session owns any, otherwise create a new one.
 *
 * The in-flight controller is a per-instance ref (passed in) — never a
 * module-level singleton — so two mounts / tabs / StrictMode double-invokes
 * cannot abort each other's create.
 */
export function useAutoCreateCharacter({
  pathname,
  authLoading,
  characterId,
  isJustLoggedOut,
  isSessionExpired,
  createCharacter,
  setCharacterId,
  trimmedLocale,
  queryClient,
  controllerRef,
  reportUnexpectedError,
  showError,
  t,
}: Params) {
  const [autoCreateFailed, setAutoCreateFailed] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  if (isJustLoggedOut && autoCreateFailed) {
    setAutoCreateFailed(false);
  }

  const shouldAutoCreateCharacter =
    pathname === '/character' &&
    !authLoading &&
    !characterId &&
    !isJustLoggedOut &&
    !isSessionExpired &&
    !autoCreateFailed;

  if (shouldAutoCreateCharacter && !checkingExisting) {
    setCheckingExisting(true);
  }

  // ---- Check for existing characters, then auto-create if none found ----
  useEffect(() => {
    if (!shouldAutoCreateCharacter) return;

    let cancelled = false;
    const controller = new AbortController();

    controllerRef.current?.abort();
    controllerRef.current = controller;

    (async () => {
      // Step 1: Check if the session already owns characters. Routed through React
      // Query (fetchQuery) so the list call is cached/deduped; the queryFn keeps
      // the deliberate raw-fetch auth-middleware bypass.
      try {
        const chars = await queryClient.fetchQuery({
          queryKey: charactersListQueryKey,
          queryFn: () => fetchCharacterList(controller.signal),
        });
        if (!cancelled && chars.length > 0) {
          setCharacterId(chars[0].id);
          setCheckingExisting(false);
          return;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (isUnexpectedApiError(e)) {
          setAutoCreateFailed(true);
          setCheckingExisting(false);
          reportUnexpectedError(
            e,
            {
              source: 'character_auto_create_list',
              operation: 'list_characters',
              locale: trimmedLocale,
            },
            'Failed to load characters'
          );
          return;
        }
        // Other errors (4xx / network) — fall through to create.
      }

      if (cancelled) return;
      setCheckingExisting(false);

      // Step 2: No existing characters — create a new one
      createCharacter.mutate(
        {
          body: {},
          params: { query: { locale: trimmedLocale } },
          signal: controller.signal,
        },
        {
          onSuccess: (character: { id?: string } | undefined) => {
            if (character?.id) {
              setCharacterId(character.id);
            }
          },
          onSettled: () => {
            if (controllerRef.current === controller) {
              controllerRef.current = null;
            }
          },
          onError: (error: unknown) => {
            if (error instanceof DOMException && error.name === 'AbortError') {
              return;
            }
            setAutoCreateFailed(true);
            if (isUnexpectedApiError(error)) {
              reportUnexpectedError(
                error,
                {
                  source: 'character_auto_create',
                  operation: 'create_character',
                  locale: trimmedLocale,
                },
                'Failed to create character'
              );
              return;
            }
            showError(
              getUserFacingApiErrorMessage(error, t, 'Failed to create character')
            );
          },
        }
      );
    })();

    return () => {
      cancelled = true;
      controller.abort();
      controllerRef.current = null;
      setCheckingExisting(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathname,
    authLoading,
    characterId,
    isJustLoggedOut,
    isSessionExpired,
    autoCreateFailed,
    shouldAutoCreateCharacter,
    trimmedLocale,
  ]);

  // ---- Set characterId once a created character lands ----
  useEffect(() => {
    const character = createCharacter.data;
    if (character?.id) {
      setCharacterId(character.id);
    }
  }, [createCharacter.data, setCharacterId]);

  return { autoCreateFailed, setAutoCreateFailed, checkingExisting };
}
