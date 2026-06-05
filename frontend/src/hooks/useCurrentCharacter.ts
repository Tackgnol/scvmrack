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
  isApiNotFound,
  isApiRateLimited,
  isUnexpectedApiError,
} from '@/utils/errorUtils';
import {
  charactersListQueryKey,
  fetchCharacterList,
} from '@/hooks/charactersListQuery';

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

type ValidationState = {
  key: string;
  issues: Record<string, string>;
  shownMessages: Record<string, string>;
};

let pendingAutoCreateController: AbortController | null = null;

function createValidationState(key: string): ValidationState {
  return {
    key,
    issues: {},
    shownMessages: {},
  };
}

function normalizeValidationState(
  state: ValidationState,
  key: string,
): ValidationState {
  return state.key === key ? state : createValidationState(key);
}

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
  const queryClient = useQueryClient();
  const validationStateKey = `${characterId ?? 'none'}:${trimmedLocale}`;
  const [validationState, setValidationState] = useState<ValidationState>(() =>
    createValidationState(validationStateKey)
  );

  if (validationState.key !== validationStateKey) {
    setValidationState(createValidationState(validationStateKey));
  }

  const activeValidationState = normalizeValidationState(
    validationState,
    validationStateKey
  );
  const validationIssueMap = activeValidationState.issues;
  const shownValidationMessages = activeValidationState.shownMessages;

  const reportUnexpectedError = (
    error: unknown,
    context: Parameters<typeof showUnexpectedError>[1],
    fallbackMessage: string
  ) => {
    if (showUnexpectedError(error, context)) {
      return;
    }

    showError(getUserFacingApiErrorMessage(error, t, fallbackMessage));
  };

  const setValidationIssue = (id: string, message: string) => {
    if (shownValidationMessages[id] !== message) {
      showError(message);
    }

    setValidationState((previous) => {
      const current = normalizeValidationState(previous, validationStateKey);
      if (
        current.issues[id] === message &&
        current.shownMessages[id] === message
      ) {
        return previous;
      }

      return {
        key: validationStateKey,
        issues: {
          ...current.issues,
          [id]: message,
        },
        shownMessages: {
          ...current.shownMessages,
          [id]: message,
        },
      };
    });
  };

  const clearValidationIssue = (id: string) => {
    setValidationState((previous) => {
      const current = normalizeValidationState(previous, validationStateKey);
      if (!(id in current.issues) && !(id in current.shownMessages)) {
        return previous;
      }

      const nextIssues = { ...current.issues };
      const nextShownMessages = { ...current.shownMessages };
      delete nextIssues[id];
      delete nextShownMessages[id];

      return {
        key: validationStateKey,
        issues: nextIssues,
        shownMessages: nextShownMessages,
      };
    });
  };

  const clearValidationIssues = () => {
    setValidationState(createValidationState(validationStateKey));
  };

  const validationIssues = Object.entries(validationIssueMap).map(([id, message]) => ({
    id,
    message,
  }));

  const validationIssueHandlers = {
    setValidationIssue,
    clearValidationIssue,
  };

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

  if (isJustLoggedOut && autoCreateFailed) {
    setAutoCreateFailed(false);
  }

  // ---- Handle logout side effects ----
  useEffect(() => {
    if (isJustLoggedOut && (characterId || lastCharacterId)) {
      // Force clear current and remembered character ID when user logs out.
      setCharacterId(null);
    }
  }, [isJustLoggedOut, characterId, lastCharacterId, setCharacterId]);

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

    pendingAutoCreateController?.abort();
    pendingAutoCreateController = controller;

    (async () => {
      // Step 1: Check if the session already owns characters. Routed through React
      // Query (fetchQuery) so the list call is cached/deduped; the queryFn keeps the
      // deliberate raw-fetch auth-middleware bypass.
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
    shouldAutoCreateCharacter,
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
  const generateNewCharacter = (classId?: number, options?: GenerateNewOptions) => {
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
  };

  // ---- Kill current character and generate a new one ----
  const killAndReplace = (options?: GenerateNewOptions) => {
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

    // Generate the replacement FIRST, then delete the old one once the new
    // character exists and is the active selection. Generate-then-delete keeps
    // the operation safe if generation fails (e.g. rate limited) — the old
    // character survives instead of leaving the app pointed at a deleted id —
    // and because the active query has already moved to the new id, removing
    // the old character's cache entry no longer refetches a deleted record.
    generateNewCharacter(undefined, {
      ...options,
      onSuccess: (newCharacterId) => {
        options?.onSuccess?.(newCharacterId);

        repo.deleteCharacter.mutate(
          { params: { path: { id: idToKill } } } as any,
          {
            onSuccess: () => {
              trackEvent('kill_character', {
                locale: trimmedLocale,
                is_authenticated: isAuthenticated,
                is_guest: isGuest,
              });
            },
            onError: (error) => {
              // The replacement is already active; a failure to delete the old
              // record is non-blocking. 404 means it was already gone.
              if (!isApiNotFound(error) && isUnexpectedApiError(error)) {
                reportUnexpectedError(
                  error,
                  {
                    source: 'character_kill',
                    operation: 'delete_character',
                    characterId: idToKill,
                    locale: trimmedLocale,
                  },
                  'Failed to delete the replaced character'
                );
              }
            },
          }
        );
      },
    });
  };

  // ---- Change locale (original logic) ----
  const changeLocale = async (newLocale: 'en' | 'pl') => {
    if (newLocale === trimmedLocale) return;
    await changeLanguage(newLocale);
    trackEvent('language_changed', { from: trimmedLocale, to: newLocale });
  };

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
