import { PathsApiCharactersNewPostParametersQueryLocale } from '@/api/schema.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useCharacterActions } from '@/hooks/useCharacterActions.ts';
import { useAutoCreateCharacter } from '@/hooks/useAutoCreateCharacter.ts';
import { useCharacterEditor } from '@/hooks/useCharacterEditor.ts';
import { useCharacterId } from '@/hooks/useCharacterId.ts';
import { useCharacterRepository } from '@/hooks/useCharacterRepository.ts';
import { useCharacterValidationIssues } from '@/hooks/useCharacterValidationIssues.ts';
import { appHistory } from '@/router/history';
import {
  hasCurrentSearchParam,
  LOGGED_OUT_QUERY_PARAM,
  SESSION_EXPIRED_QUERY_PARAM,
} from '@/router/navigation';
import { getApiLocale } from '@/hooks/utils.ts';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const subscribeToHistory = (onStoreChange: () => void): (() => void) => {
  return appHistory.subscribe(() => onStoreChange());
};

const getLoggedOutSnapshot = (): boolean =>
  hasCurrentSearchParam(LOGGED_OUT_QUERY_PARAM);

const getSessionExpiredSnapshot = (): boolean =>
  hasCurrentSearchParam(SESSION_EXPIRED_QUERY_PARAM);

const getPathnameSnapshot = (): string => appHistory.location.pathname;

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
  const {
    validationIssues,
    setValidationIssue,
    clearValidationIssue,
    clearValidationIssues,
    validationIssueHandlers,
  } = useCharacterValidationIssues(validationStateKey);

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

  const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth();

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

  // Per-instance in-flight controller, shared between the auto-create flow and
  // manual generation so they cancel each other — never a module-level singleton.
  const autoCreateControllerRef = useRef<AbortController | null>(null);

  const { setAutoCreateFailed, checkingExisting } =
    useAutoCreateCharacter({
      pathname,
      authLoading,
      characterId,
      isJustLoggedOut,
      isSessionExpired,
      createCharacter: repo.createCharacter,
      setCharacterId,
      trimmedLocale,
      queryClient,
      controllerRef: autoCreateControllerRef,
      reportUnexpectedError,
      showError,
      t,
    });

  const { generateNew, killAndReplace, changeLocale } = useCharacterActions({
    characterId,
    isSessionExpired,
    trimmedLocale,
    isAuthenticated,
    isGuest,
    createCharacter: repo.createCharacter,
    deleteCharacter: repo.deleteCharacter,
    setCharacterId,
    flushEditor: editor.flush,
    setAutoCreateFailed,
    controllerRef: autoCreateControllerRef,
    reportUnexpectedError,
    showError,
    t,
    changeLanguage,
  });

  // ---- Handle logout side effects ----
  useEffect(() => {
    if (isJustLoggedOut && (characterId || lastCharacterId)) {
      // Force clear current and remembered character ID when user logs out.
      setCharacterId(null);
    }
  }, [isJustLoggedOut, characterId, lastCharacterId, setCharacterId]);

  return {
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
    generateNew,
    killAndReplace,

    // All editor methods exposed
    ...editor,
    flushUpdates: editor.flush,

    isAuthenticated,
    isGuest,

    isJustLoggedOut,
    isSessionExpired,
  };
}
