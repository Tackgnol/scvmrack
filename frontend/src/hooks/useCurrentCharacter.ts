import { PathsApiCharactersNewPostParametersQueryLocale } from '@/api/schema.ts';
import { trackEvent } from '@/analytics/googleAnalytics';
import { useAuth } from '@/hooks/useAuth.ts';
import { useCharacterEditor } from '@/hooks/useCharacterEditor.ts';
import { useCharacterId } from '@/hooks/useCharacterId.ts';
import { useCharacterRepository } from '@/hooks/useCharacterRepository.ts';
import { appHistory } from '@/router/history';
import {
  hasCurrentSearchParam,
  LOGGED_OUT_QUERY_PARAM,
  SESSION_EXPIRED_QUERY_PARAM,
} from '@/router/navigation';
import { getApiLocale } from '@/hooks/utils.ts';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import {
  getUserFacingApiErrorMessage,
  isApiRateLimited,
  isUnexpectedApiError,
  toApiClientError,
} from '@/utils/errorUtils';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';

const subscribeToHistory = (onStoreChange: () => void): (() => void) => {
  return appHistory.subscribe(() => onStoreChange());
};

const getLoggedOutSnapshot = (): boolean => {
  return hasCurrentSearchParam(LOGGED_OUT_QUERY_PARAM);
};

const getSessionExpiredSnapshot = (): boolean => {
  return hasCurrentSearchParam(SESSION_EXPIRED_QUERY_PARAM);
};

const getPathnameSnapshot = (): string => {
  return appHistory.location.pathname;
};

type GenerateNewOptions = {
  onSuccess?: (newCharacterId: string) => void;
  onError?: (error: unknown) => void;
};

let pendingAutoCreateController: AbortController | null = null;

export function useCurrentCharacter() {
  const { characterId, lastCharacterId, setCharacterId } = useCharacterId();
  const {
    t,
    i18n: { changeLanguage, language: locale },
  } = useTranslation();
  const trimmedLocale =
    getApiLocale<PathsApiCharactersNewPostParametersQueryLocale>(locale);
  const { showError } = useSnackbar();
  const { showUnexpectedError } = useErrorFeedback();
  const [validationIssueMap, setValidationIssueMap] = useState<
    Record<string, string>
  >({});

  const reportUnexpectedError = useCallback(
    (
      error: unknown,
      context: Parameters<typeof showUnexpectedError>[1],
      fallbackMessage: string
    ) => {
      if (showUnexpectedError(error, context)) {
        return;
      }

      showError(getUserFacingApiErrorMessage(error, t, fallbackMessage));
    },
    [showError, showUnexpectedError, t]
  );

  const setValidationIssue = useCallback((id: string, message: string) => {
    setValidationIssueMap((previous) => {
      if (previous[id] === message) return previous;
      return {
        ...previous,
        [id]: message,
      };
    });
  }, []);

  const clearValidationIssue = useCallback((id: string) => {
    setValidationIssueMap((previous) => {
      if (!(id in previous)) return previous;
      const { [id]: _removed, ...next } = previous;
      return next;
    });
  }, []);

  const clearValidationIssues = useCallback(() => {
    setValidationIssueMap({});
  }, []);

  useEffect(() => {
    clearValidationIssues();
  }, [characterId, clearValidationIssues, trimmedLocale]);

  const validationIssues = useMemo(
    () =>
      Object.entries(validationIssueMap).map(([id, message]) => ({
        id,
        message,
      })),
    [validationIssueMap]
  );

  const validationIssueHandlers = useMemo(
    () => ({
      setValidationIssue,
      clearValidationIssue,
    }),
    [clearValidationIssue, setValidationIssue]
  );

  const isJustLoggedOut = useSyncExternalStore(
    subscribeToHistory,
    getLoggedOutSnapshot,
    () => false
  );
  const isSessionExpired = useSyncExternalStore(
    subscribeToHistory,
    getSessionExpiredSnapshot,
    () => false
  );
  const pathname = useSyncExternalStore(
    subscribeToHistory,
    getPathnameSnapshot,
    () => '/'
  );

  // Auth state
  const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth();

  // Repository and editor (original pattern preserved)
  const repo = useCharacterRepository(characterId, locale, {
    enabled: !isSessionExpired,
  });
  const editor = useCharacterEditor(
    characterId,
    repo.updateCharacter,
    repo.getCharacterKey,
    trimmedLocale,
    validationIssueHandlers
  );

  const [autoCreateFailed, setAutoCreateFailed] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // ---- Handle logout side effects ----
  useEffect(() => {
    if (isJustLoggedOut && (characterId || lastCharacterId)) {
      // Force clear current and remembered character ID when user logs out.
      setCharacterId(null);
      setAutoCreateFailed(false);
    }
  }, [isJustLoggedOut, characterId, lastCharacterId, setCharacterId]);

  // ---- Check for existing characters, then auto-create if none found ----
  useEffect(() => {
    if (pathname !== '/character') return;
    if (authLoading) return;
    if (characterId) return;
    if (isJustLoggedOut) return;
    if (isSessionExpired) return;
    if (autoCreateFailed) return;

    let cancelled = false;
    const controller = new AbortController();

    pendingAutoCreateController?.abort();
    pendingAutoCreateController = controller;
    setCheckingExisting(true);

    (async () => {
      // Step 1: Check if user already has characters (raw fetch to avoid auth middleware redirect)
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${baseUrl}/api/characters`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!cancelled && res.ok) {
          const chars = (await res.json()) as Array<{ id: string }>;
          if (chars.length > 0) {
            setCharacterId(chars[0].id);
            setCheckingExisting(false);
            return;
          }
        }

        if (!cancelled && !res.ok) {
          const errorBody = await res.json().catch(() => null);
          const apiError = toApiClientError(
            errorBody,
            res,
            'Failed to load characters'
          );

          if (isUnexpectedApiError(apiError)) {
            setAutoCreateFailed(true);
            setCheckingExisting(false);
            reportUnexpectedError(
              apiError,
              {
                source: 'character_auto_create_list',
                operation: 'list_characters',
                locale: trimmedLocale,
              },
              'Failed to load characters'
            );
            return;
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        // List fetch failed — fall through to create
      }

      if (cancelled) return;
      setCheckingExisting(false);

      // Step 2: No existing characters — create a new one
      repo.createCharacter.mutate(
        {
          body: {},
          params: { query: { locale: trimmedLocale } },
          signal: controller.signal,
        },
        {
          onSuccess: (character) => {
            if (character?.id) {
              setCharacterId(character.id);
            }
          },
          onSettled: () => {
            if (pendingAutoCreateController === controller) {
              pendingAutoCreateController = null;
            }
          },
          onError: (error) => {
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
              getUserFacingApiErrorMessage(
                error,
                t,
                'Failed to create character'
              )
            );
          },
        }
      );
    })();

    return () => {
      cancelled = true;
      controller.abort();
      pendingAutoCreateController = null;
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
    trimmedLocale,
  ]);

  // ---- Set characterId when character is created (original logic) ----
  useEffect(() => {
    const character = repo.createCharacter.data;
    if (character?.id) {
      setCharacterId(character.id);
    }
  }, [repo.createCharacter.data, setCharacterId]);

  // ---- Generate new character (original logic) ----
  const generateNewCharacter = useCallback(
    (classId?: number, options?: GenerateNewOptions) => {
      if (isSessionExpired) {
        return;
      }

      pendingAutoCreateController?.abort();
      pendingAutoCreateController = null;
      setAutoCreateFailed(false);

      editor.flush();
      const id = classId ?? Math.floor(Math.random() * (6 - 1 + 1)) + 1;

      repo.createCharacter.mutate(
        {
          body: { classId: id },
          params: { query: { locale: trimmedLocale } },
        },
        {
          onSuccess: (character) => {
            if (character?.id) {
              setCharacterId(character.id);
              options?.onSuccess?.(character.id);
            }
            trackEvent('generate_character', {
              source: 'manual',
              locale: trimmedLocale,
              classId: id,
              is_authenticated: isAuthenticated,
              is_guest: isGuest,
            });
          },
          onError: (error) => {
            if (isApiRateLimited(error)) {
              showError(
                t(
                  'auth.rateLimit',
                  'Too many requests. Please try again later.'
                )
              );
            } else if (isUnexpectedApiError(error)) {
              reportUnexpectedError(
                error,
                {
                  source: 'character_generate',
                  operation: 'create_character',
                  locale: trimmedLocale,
                  classId: id,
                },
                'Failed to create character'
              );
            } else {
              showError(
                getUserFacingApiErrorMessage(
                  error,
                  t,
                  'Failed to create character'
                )
              );
            }
            options?.onError?.(error);
          },
        }
      );
    },
    [
      editor,
      repo.createCharacter,
      trimmedLocale,
      isAuthenticated,
      isGuest,
      isSessionExpired,
      setCharacterId,
      setAutoCreateFailed,
      showError,
      reportUnexpectedError,
      t,
    ]
  );

  // ---- Kill current character and generate a new one ----
  const killAndReplace = useCallback(
    (options?: GenerateNewOptions) => {
      if (isSessionExpired) {
        return;
      }

      const idToKill = characterId;
      if (!idToKill) {
        // No character to kill, just generate
        generateNewCharacter(undefined, options);
        return;
      }

      editor.flush();

      // Delete first, then generate
      repo.deleteCharacter.mutate(
        { params: { path: { id: idToKill } } } as any,
        {
          onSuccess: () => {
            trackEvent('kill_character', {
              locale: trimmedLocale,
              is_authenticated: isAuthenticated,
              is_guest: isGuest,
            });
            generateNewCharacter(undefined, options);
          },
          onError: (error) => {
            if (isUnexpectedApiError(error)) {
              reportUnexpectedError(
                error,
                {
                  source: 'character_kill',
                  operation: 'delete_character',
                  characterId: idToKill,
                  locale: trimmedLocale,
                },
                'Failed to kill character'
              );
            } else {
              showError(
                getUserFacingApiErrorMessage(
                  error,
                  t,
                  'Failed to kill character'
                )
              );
            }
            options?.onError?.(error);
          },
        }
      );
    },
    [
      characterId,
      editor,
      repo.deleteCharacter,
      generateNewCharacter,
      trimmedLocale,
      isAuthenticated,
      isGuest,
      isSessionExpired,
      showError,
      reportUnexpectedError,
      t,
    ]
  );

  // ---- Change locale (original logic) ----
  const changeLocale = useCallback(
    async (newLocale: 'en' | 'pl') => {
      if (newLocale === trimmedLocale) return;
      await changeLanguage(newLocale);
      trackEvent('language_changed', { from: trimmedLocale, to: newLocale });
    },
    [trimmedLocale, changeLanguage]
  );

  return {
    // Original returns
    characterId,
    lastCharacterId,
    character: repo.character,
    error: repo.error,
    isLoading:
      repo.isLoading ||
      repo.createCharacter.isPending ||
      authLoading ||
      checkingExisting,
    locale,
    validationIssues,
    setValidationIssue,
    clearValidationIssue,
    clearValidationIssues,

    setCharacterId,
    changeLocale,
    generateNew: generateNewCharacter,
    killAndReplace,

    // All editor methods exposed (original)
    ...editor,
    flushUpdates: editor.flush,

    // NEW: Auth state
    isAuthenticated,
    isGuest,

    isJustLoggedOut,
    isSessionExpired,
  };
}
