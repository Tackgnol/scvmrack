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
import { getApiLocale, getCharacterKey } from '@/hooks/utils.ts';
import { characterKeys } from '@/api';
import type { CharacterResponse } from '@/hooks/models';
import { usePrivacyAcknowledged } from '@/privacy/privacyConsent';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
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

// "Just created" intent in a module-level store, read via useSyncExternalStore
// (the same pattern this hook already uses for history). Living outside React,
// it survives the provider/tree recreation that can happen during the
// create->sheet route transition — and it needs no context, so the context's
// unit tests render without extra providers.
let justCreatedStore: string | null = null;
const justCreatedListeners = new Set<() => void>();
const setJustCreated = (id: string | null): void => {
  justCreatedStore = id;
  justCreatedListeners.forEach((listener) => listener());
};
const subscribeJustCreated = (onStoreChange: () => void): (() => void) => {
  justCreatedListeners.add(onStoreChange);
  return () => {
    justCreatedListeners.delete(onStoreChange);
  };
};
const getJustCreatedSnapshot = (): string | null => justCreatedStore;

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
  const privacyAcknowledged = usePrivacyAcknowledged();

  const repo = useCharacterRepository(characterId, locale, {
    enabled: !isSessionExpired,
  });
  const isReadOnly = repo.character?.viewerAccess === 'party';
  const editor = useCharacterEditor(
    characterId,
    repo.updateCharacter,
    repo.getCharacterKey,
    trimmedLocale,
    validationIssueHandlers,
    { readOnly: isReadOnly }
  );
  const visibleCharacter =
    editor.getVisibleCharacter?.(repo.character) ?? repo.character;

  // Per-instance in-flight controller, shared between the auto-create flow and
  // manual generation so they cancel each other — never a module-level singleton.
  const autoCreateControllerRef = useRef<AbortController | null>(null);

  const { setAutoCreateFailed, checkingExisting } =
    useAutoCreateCharacter({
      pathname,
      authLoading,
      privacyAcknowledged,
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
    partyId: repo.character?.partyId ?? null,
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

  // ---- Freshly created character handoff ----
  // The draft-creation flow hits the same POST /api/characters/new as
  // generateNew, so its result enters through the same door: seed the detail
  // cache, refresh the list, select it. The create intent is parked in the
  // shared query cache so the sheet can acknowledge the new wretch exactly once
  // — read identically from any useCharacter() consumer, no out-of-band signal.
  const justCreatedId = useSyncExternalStore(
    subscribeJustCreated,
    getJustCreatedSnapshot,
    getJustCreatedSnapshot
  );

  const adoptCreatedCharacter = useCallback(
    (character: CharacterResponse) => {
      if (!character?.id) return;
      // Enter through the same door as generateNew: seed the detail cache and
      // refresh the list (mirroring repo.createCharacter.onSuccess), record the
      // create intent, then navigate. push+flush (not setCharacterId) avoids the
      // mid-confirm in-provider state update that can trip the route error
      // boundary during the create->sheet transition.
      queryClient.setQueryData(getCharacterKey(character.id, locale), character);
      queryClient.invalidateQueries({ queryKey: characterKeys.list() });
      setJustCreated(character.id);
      void appHistory.push(`/character/${character.id}`);
      appHistory.flush();
    },
    [queryClient, locale]
  );

  const acknowledgeCreated = useCallback(() => setJustCreated(null), []);

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
    character: visibleCharacter,
    isReadOnly,
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
    justCreatedId,
    adoptCreatedCharacter,
    acknowledgeCreated,

    // All editor methods exposed
    ...editor,
    flushUpdates: editor.flush,

    isAuthenticated,
    isGuest,

    isJustLoggedOut,
    isSessionExpired,
  };
}
