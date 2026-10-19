import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AbilityStat,
  type ClasslessStatOption,
  confirmDraft,
  createDraft,
  rerollDraftSection,
  type CharacterDraft,
  type DraftResponse,
  type DraftSection,
} from '@/api/draft';
import type { CharacterResponse } from '@/hooks/models';
import { getApiErrorCode, getUserFacingApiErrorMessage } from '@/utils/errorUtils';
import { ensureAnonymousSession } from '@/auth';
import { authKeys } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { usePrivacyAcknowledged } from '@/privacy/privacyConsent';

export const DRAFT_STORAGE_KEY = 'scvmrack.character-draft';

export type DraftPhase = 'class-gate' | 'sheet';
export type StartChoice = {
  classId?: number | null;
  classless?: boolean;
  name?: string;
  dropLowestAbilities?: AbilityStat[];
};

type Options = {
  onCreated?: (character: CharacterResponse) => void | Promise<void>;
  /** A party invite: rolls come from its Party Class Pool and confirming joins the party. */
  inviteToken?: string;
  /** An Owlbear room rolls from its attached party pool and joins it on confirm. */
  obrRoomId?: string;
  /** The Owlbear player receiving the completed scvm binding. */
  obrPlayerId?: string;
};

const UNAVAILABLE_CLASS_CODES = new Set(['CLASS_NOT_AVAILABLE', 'CLASSLESS_NOT_AVAILABLE']);
const UNAVAILABLE_CLASS_MESSAGE =
  'That class is no longer available here. Pick again from the classes on offer.';

function isUnavailableClass(error: unknown): boolean {
  const code = getApiErrorCode(error);
  return code !== undefined && UNAVAILABLE_CLASS_CODES.has(code);
}

/** The start choice that re-derives a saved draft's preview from its seeds. */
function choiceFromDraft(draft: CharacterDraft): StartChoice {
  const choice: StartChoice = {
    classId: draft.classId ?? undefined,
    classless: draft.classless,
    dropLowestAbilities: draft.dropLowestAbilities,
  };
  if (draft.name !== undefined) {
    choice.name = draft.name;
  }
  return choice;
}

function fallbackT(_key: string, fallback: string): string {
  return fallback;
}

/**
 * State machine for the creation flow. The draft seed bundle is persisted;
 * previews are always re-derived from the server.
 */
export function useCharacterDraft(locale: string, options: Options = {}) {
  const queryClient = useQueryClient();
  const privacyAcknowledged = usePrivacyAcknowledged();
  const [phase, setPhase] = useState<DraftPhase>('class-gate');
  const [draft, setDraft] = useState<CharacterDraft | null>(null);
  const [preview, setPreview] = useState<CharacterResponse | null>(null);
  const [classlessStatOptions, setClasslessStatOptions] = useState<ClasslessStatOption[] | null>(null);
  const [rollingSection, setRollingSection] = useState<DraftSection | null>(null);
  const [isChoosingStats, setIsChoosingStats] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const onCreatedRef = useRef(options.onCreated);
  onCreatedRef.current = options.onCreated;
  const { inviteToken, obrRoomId, obrPlayerId } = options;
  // A scoped forge keeps its own saved draft so a solo draft never leaks into it.
  const scopeKey = inviteToken ?? obrRoomId;
  const storageKey = scopeKey ? `${DRAFT_STORAGE_KEY}:${scopeKey}` : DRAFT_STORAGE_KEY;

  // A class switched off, archived or taken down mid-forge: back to the class
  // screen, which reloads the pool. The landed roll is dropped, never swapped.
  const backToClassGate = useCallback((message: string) => {
    abortRef.current?.abort();
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore unavailable storage
    }
    setDraft(null);
    setPreview(null);
    setClasslessStatOptions(null);
    setPhase('class-gate');
    setError(message);
  }, [storageKey]);

  const applyResponse = useCallback((response: DraftResponse) => {
    setDraft(response.draft);
    setPreview(response.preview);
    setClasslessStatOptions(response.classlessStatOptions ?? null);
    setPhase('sheet');
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(response.draft));
    } catch {
      // The flow still works without storage; refresh will restart it.
    }
  }, [storageKey]);

  const clearStored = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore unavailable storage
    }
  }, [storageKey]);

  const start = useCallback(
    async (choice: StartChoice, seeds?: CharacterDraft['seeds']) => {
      if (busyRef.current || !privacyAcknowledged) {
        return;
      }
      busyRef.current = true;
      setIsStarting(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        const session = await ensureAnonymousSession();
        controller.signal.throwIfAborted();
        queryClient.setQueryData(authKeys.session(), session);
        const response = await createDraft(
          seeds ? { ...choice, seeds } : choice,
          locale,
          controller.signal,
          inviteToken,
          obrRoomId,
          obrPlayerId,
        );
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        clearStored();
        setPhase('class-gate');
        setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to roll a draft'));
      } finally {
        busyRef.current = false;
        setIsStarting(false);
      }
    },
    [locale, inviteToken, obrRoomId, obrPlayerId, applyResponse, clearStored, queryClient, privacyAcknowledged],
  );

  const reroll = useCallback(
    async (section: DraftSection) => {
      if (busyRef.current || !draft) {
        return;
      }
      busyRef.current = true;
      setRollingSection(section);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const draftForReroll = section === 'name'
          ? {
              classId: draft.classId,
              classless: draft.classless,
              ...(draft.classless ? { dropLowestAbilities: draft.dropLowestAbilities } : {}),
              seeds: draft.seeds,
            }
          : draft;
        const response = await rerollDraftSection(
          draftForReroll,
          section,
          locale,
          controller.signal,
          inviteToken,
          obrRoomId,
          obrPlayerId,
        );
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        if (isUnavailableClass(e)) {
          backToClassGate(UNAVAILABLE_CLASS_MESSAGE);
          return;
        }
        setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to re-roll'));
      } finally {
        busyRef.current = false;
        setRollingSection(null);
      }
    },
    [draft, locale, inviteToken, obrRoomId, obrPlayerId, applyResponse, backToClassGate],
  );

  const setName = useCallback((rawName: string) => {
    const name = rawName.slice(0, 255);
    setDraft((current) => {
      if (!current) {
        return current;
      }
      const next: CharacterDraft = { ...current, name };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // The flow still works without storage; refresh will restart it.
      }
      return next;
    });
    setPreview((current) => current ? { ...current, name } : current);
  }, [storageKey]);

  const setDropLowestAbilities = useCallback(
    async (abilities: AbilityStat[]) => {
      if (busyRef.current || !draft || !draft.classless) {
        return;
      }
      busyRef.current = true;
      setIsChoosingStats(true);
      setError(null);

      const nextAbilities = [...new Set(abilities)].slice(0, 2) as AbilityStat[];
      const nextDraft: CharacterDraft = {
        ...draft,
        classId: null,
        classless: true,
        dropLowestAbilities: nextAbilities,
      };

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await createDraft(nextDraft, locale, controller.signal, inviteToken, obrRoomId, obrPlayerId);
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to choose stat rolls'));
      } finally {
        busyRef.current = false;
        setIsChoosingStats(false);
      }
    },
    [draft, locale, inviteToken, obrRoomId, obrPlayerId, applyResponse],
  );

  const confirm = useCallback(async (replace = false) => {
    if (busyRef.current || !draft) {
      return;
    }
    busyRef.current = true;
    setIsConfirming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const character = await confirmDraft(draft, locale, controller.signal, replace, inviteToken, obrRoomId, obrPlayerId);
      clearStored();
      if (character.id) {
        await onCreatedRef.current?.(character);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return;
      }
      if (isUnavailableClass(e)) {
        backToClassGate(UNAVAILABLE_CLASS_MESSAGE);
        return;
      }
      setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to create character'));
    } finally {
      busyRef.current = false;
      setIsConfirming(false);
    }
  }, [draft, locale, inviteToken, obrRoomId, obrPlayerId, clearStored, backToClassGate]);

  const restart = useCallback(() => {
    abortRef.current?.abort();
    busyRef.current = false;
    clearStored();
    setDraft(null);
    setPreview(null);
    setClasslessStatOptions(null);
    setIsChoosingStats(false);
    setPhase('class-gate');
    setError(null);
  }, [clearStored]);

  useEffect(() => {
    if (!privacyAcknowledged) {
      return;
    }
    let stored: CharacterDraft | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        stored = JSON.parse(raw) as CharacterDraft;
      }
    } catch {
      clearStored();
      return;
    }

    if (!stored || typeof stored !== 'object' || !stored.seeds) {
      if (stored !== null) {
        clearStored();
      }
      return;
    }

    void start(choiceFromDraft(stored), stored.seeds);
    // Rehydrate on mount or when the visitor acknowledges storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privacyAcknowledged]);

  // The preview carries localized catalog text, so a language switch re-derives it from the same seeds.
  const previewLocaleRef = useRef(locale);
  useEffect(() => {
    if (previewLocaleRef.current === locale) {
      return;
    }
    previewLocaleRef.current = locale;
    if (draft) {
      void start(choiceFromDraft(draft), draft.seeds);
    }
  }, [locale, draft, start]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    phase,
    draft,
    preview,
    classlessStatOptions,
    rollingSection,
    isChoosingStats,
    isStarting,
    isConfirming,
    error,
    start,
    reroll,
    setName,
    setDropLowestAbilities,
    confirm,
    restart,
  };
}
