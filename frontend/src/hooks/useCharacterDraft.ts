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
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';

export const DRAFT_STORAGE_KEY = 'scvmrack.character-draft';

export type DraftPhase = 'class-gate' | 'sheet';
export type StartChoice = {
  classId?: number | null;
  classless?: boolean;
  name?: string;
  dropLowestAbilities?: AbilityStat[];
};

type Options = {
  onCreated?: (character: CharacterResponse) => void;
};

function fallbackT(_key: string, fallback: string): string {
  return fallback;
}

/**
 * State machine for the creation flow. The draft seed bundle is persisted;
 * previews are always re-derived from the server.
 */
export function useCharacterDraft(locale: string, options: Options = {}) {
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

  const applyResponse = useCallback((response: DraftResponse) => {
    setDraft(response.draft);
    setPreview(response.preview);
    setClasslessStatOptions(response.classlessStatOptions ?? null);
    setPhase('sheet');
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(response.draft));
    } catch {
      // The flow still works without storage; refresh will restart it.
    }
  }, []);

  const clearStored = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const start = useCallback(
    async (choice: StartChoice, seeds?: CharacterDraft['seeds']) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setIsStarting(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        const response = await createDraft(
          seeds ? { ...choice, seeds } : choice,
          locale,
          controller.signal,
        );
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        clearStored();
        setPhase('class-gate');
        setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to roll a draft'));
      } finally {
        busyRef.current = false;
        setIsStarting(false);
      }
    },
    [locale, applyResponse, clearStored],
  );

  const reroll = useCallback(
    async (section: DraftSection) => {
      if (busyRef.current || !draft) return;
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
        const response = await rerollDraftSection(draftForReroll, section, locale, controller.signal);
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to re-roll'));
      } finally {
        busyRef.current = false;
        setRollingSection(null);
      }
    },
    [draft, locale, applyResponse],
  );

  const setName = useCallback((rawName: string) => {
    const name = rawName.slice(0, 255);
    setDraft((current) => {
      if (!current) return current;
      const next: CharacterDraft = { ...current, name };
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The flow still works without storage; refresh will restart it.
      }
      return next;
    });
    setPreview((current) => current ? { ...current, name } : current);
  }, []);

  const setDropLowestAbilities = useCallback(
    async (abilities: AbilityStat[]) => {
      if (busyRef.current || !draft || !draft.classless) return;
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
        const response = await createDraft(nextDraft, locale, controller.signal);
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to choose stat rolls'));
      } finally {
        busyRef.current = false;
        setIsChoosingStats(false);
      }
    },
    [draft, locale, applyResponse],
  );

  const confirm = useCallback(async (replace = false) => {
    if (busyRef.current || !draft) return;
    busyRef.current = true;
    setIsConfirming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const character = await confirmDraft(draft, locale, controller.signal, replace);
      clearStored();
      if (character.id) {
        onCreatedRef.current?.(character);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(getUserFacingApiErrorMessage(e, fallbackT, 'Failed to create character'));
    } finally {
      busyRef.current = false;
      setIsConfirming(false);
    }
  }, [draft, locale, clearStored]);

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
    let stored: CharacterDraft | null = null;
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as CharacterDraft;
    } catch {
      clearStored();
      return;
    }

    if (!stored || typeof stored !== 'object' || !stored.seeds) {
      if (stored !== null) clearStored();
      return;
    }

    const choice: StartChoice = {
      classId: stored.classId ?? undefined,
      classless: stored.classless,
      dropLowestAbilities: stored.dropLowestAbilities,
    };
    if (stored.name !== undefined) {
      choice.name = stored.name;
    }
    void start(choice, stored.seeds);
    // Mount-only rehydration by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
