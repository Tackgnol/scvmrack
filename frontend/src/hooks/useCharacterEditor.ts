import { appHistory } from '@/router/history';
import { trackCharacterEdited } from '@/analytics/characterAnalytics';
import { $api } from '@/api';
import { applyOptimisticPatch } from '@/hooks/applyOptimisticPatch.ts';
import {
  CharacterResponse,
  CharacterUpdateRequest,
  CustomModifier,
  EquipmentItem,
  OptimisticPatch,
  SimpleField,
} from '@/hooks/models.ts';
import { buildRequestFromPatches } from '@/hooks/patchToRequest.ts';
import { API_LOCALES, getApiLocale } from '@/hooks/utils.ts';
import { createRandomId } from '@/utils/randomId';
import {
  getSimpleFieldLimitMessage,
  sanitizeSimpleFieldValue,
} from '@/validation/characterUpdate';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import {
  getApiErrorStatus,
  getUserFacingApiErrorMessage,
  isApiRateLimited,
  isUnexpectedApiError,
} from '@/utils/errorUtils';

type ValidationIssueHandlers = {
  setValidationIssue?: (id: string, message: string) => void;
  clearValidationIssue?: (id: string) => void;
};

const getSimpleFieldValidationId = (field: SimpleField) => `field:${field}`;

const createEditorState = (locale?: string) => ({
  pending: [] as OptimisticPatch[],
  saveFailed: false,
  awaitingAuth: false,
  retryCount: 0,
  optimisticCharacter: undefined as CharacterResponse | undefined,
  lastSavedCharacter: undefined as CharacterResponse | undefined,
  locale,
  flushing: false,
  halted: false,
  unconfirmedSave: null as { batch: OptimisticPatch[]; body: CharacterUpdateRequest } | null,
  navigationWaiters: [] as Array<(blocked: boolean) => void>,
});

export function useCharacterEditor(
  characterId: string | null,
  updateCharacter: ReturnType<typeof $api.useMutation>,
  getCharacterKey: (id: string, locale?: string) => readonly unknown[],
  locale?: string,
  validationIssues?: ValidationIssueHandlers,
  options: { readOnly?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const { showError } = useSnackbar();
  const { showUnexpectedError } = useErrorFeedback();
  const { t } = useTranslation();
  const readOnly = options.readOnly === true;
  const shownFieldValidationMessagesRef = useRef<Record<string, string>>({});

  // The provider outlives sheet routes. Each callback must retain its own
  // character's queue, including after an auth redirect or a sheet switch.
  const statesRef = useRef(new Map<string | null, ReturnType<typeof createEditorState>>());
  const getState = useCallback(() => {
    let entry = statesRef.current.get(characterId);
    if (!entry) {
      entry = createEditorState(locale);
      statesRef.current.set(characterId, entry);
    }
    return entry;
  }, [characterId, locale]);
  const activeCharacterIdRef = useRef(characterId);
  const [snapshots, setSnapshots] = useState(new Map<string | null, { pendingCount: number; saveFailed: boolean }>());
  const snapshot = snapshots.get(characterId);
  const refresh = () => {
    const state = getState();
    const next = {
      pendingCount: state.pending.length,
      saveFailed: state.saveFailed,
    };
    setSnapshots((previous) => new Map(previous).set(characterId, next));
  };
  const setSaveFailed = (value: boolean) => {
    getState().saveFailed = value;
    refresh();
  };
  const setPending = (
    updater: (prev: OptimisticPatch[]) => OptimisticPatch[]
  ) => {
    getState().pending = updater(getState().pending);
    refresh();
  };

  // Retry tracking
  const flushRef = useRef<() => void>(() => {});
  const maxRetries = 3;

  const retrySave = () => {
    const state = getState();
    if (activeCharacterIdRef.current !== characterId) {
      return;
    }
    state.awaitingAuth = false;
    state.retryCount = 0;
    state.halted = false;
    setSaveFailed(false);
    flushRef.current();
  };

  const getActiveKey = () =>
    characterId ? getCharacterKey(characterId, locale) : undefined;

  const getActiveCachedCharacter = () => {
    const key = getActiveKey();
    return key ? queryClient.getQueryData<CharacterResponse>(key) : undefined;
  };

  const getLatestOptimisticCharacter = () =>
    getState().optimisticCharacter ?? getActiveCachedCharacter();

  const isNewerThan = (
    candidate: CharacterResponse | undefined,
    reference: CharacterResponse | undefined
  ) => {
    if (!candidate?.updatedAt || !reference?.updatedAt) {
      return false;
    }
    return Date.parse(candidate.updatedAt) > Date.parse(reference.updatedAt);
  };

  /**
   * Takes a newer server copy written to the cache elsewhere (Getting Better, party refetch) as the
   * editing base, but only with nothing queued: replaying index-based edits onto it could hit the wrong item.
   */
  const adoptNewerCachedCharacter = () => {
    const state = getState();
    if (state.pending.length > 0 || state.flushing || updateCharacter.isPending) {
      return;
    }
    if (state.locale !== locale) {
      state.optimisticCharacter = undefined;
      state.lastSavedCharacter = undefined;
      state.locale = locale;
    }
    const cached = getActiveCachedCharacter();
    if (isNewerThan(cached, state.optimisticCharacter)) {
      state.optimisticCharacter = cached;
    }
  };

  const flush = () => {
    const state = getState();
    if (!characterId || readOnly || state.awaitingAuth) {
      return;
    }
    // One PATCH in flight at a time; onSettled re-flushes whatever remains.
    if (state.flushing || updateCharacter.isPending) {
      return;
    }

    const unconfirmed = state.unconfirmedSave;
    const batch = unconfirmed ? unconfirmed.batch : [...state.pending];
    if (batch.length === 0) {
      return;
    }

    const key = getActiveKey();
    const currentCharacter = getLatestOptimisticCharacter();
    if (!currentCharacter) {
      return;
    }

    // Build request body from the queued patches + the current optimistic state.
    const body: CharacterUpdateRequest = unconfirmed
      ? unconfirmed.body
      : { ...buildRequestFromPatches(batch, currentCharacter), saveId: createRandomId() };
    state.flushing = true;

    updateCharacter.mutate(
      {
        // Send the active locale so the hydrated PATCH response (computed
        // modifiers, encumbrance sources, item names) comes back translated —
        // without it the backend defaults to 'en' and recalculated modifiers
        // reverted to English on the Polish view.
        params: { path: { id: characterId }, query: { locale: getApiLocale(locale) } },
        body: body as any,
      },
      {
        onSuccess: (serverCharacter: unknown) => {
          state.unconfirmedSave = null;
          setSaveFailed(false);
          state.retryCount = 0;
          state.halted = false;
          trackCharacterEdited(batch, locale ?? 'en');

          // Drop exactly the patches we sent (a prefix of the queue); anything
          // queued during the flight stays pending.
          setPending((prev) => prev.slice(batch.length));

          // The PATCH response is server-authoritative and already hydrated.
          // Write it to cache, then re-apply patches that arrived mid-flight so
          // their optimistic state survives.
          const server = serverCharacter as CharacterResponse | undefined;
          const cached = key ? queryClient.getQueryData<CharacterResponse>(key) : undefined;
          state.locale = locale;
          // Other locales still hold the pre-save character: mark them stale. This only refetches one
          // that is on screen, i.e. the language was switched while this save was in flight.
          API_LOCALES.filter((other) => other !== locale).forEach((other) => {
            void queryClient.invalidateQueries({ queryKey: getCharacterKey(characterId, other), exact: true });
          });
          if (server && state.pending.length === 0 && isNewerThan(cached, server)) {
            // A newer server copy (e.g. Getting Better) landed mid-flight; it already includes this save.
            state.lastSavedCharacter = server;
            state.optimisticCharacter = cached;
          } else if (server) {
            const remaining = state.pending;
            const optimistic = remaining.reduce(
              (acc, patch) => applyOptimisticPatch(acc, patch),
              server
            );
            state.lastSavedCharacter = server;
            state.optimisticCharacter = optimistic;
            if (key) {
              queryClient.setQueryData<CharacterResponse>(key, optimistic);
            }
          }
        },
        onError: (error: any, _vars: unknown, context: any) => {
          if (isApiRateLimited(error)) {
            // Keep the batch queued (don't lose the edit) but stop hammering the
            // limiter — the next edit or unmount will flush it again.
            state.halted = true;
            showError(
              t('auth.rateLimit', 'Too many requests. Please try again later.')
            );
            return;
          }

          // Transient = server error (5xx) or a network failure (no status).
          // Both are worth retrying; the queued batch is kept and onSettled
          // re-flushes it until we run out of attempts.
          const status = getApiErrorStatus(error);
          if (status === 401) {
            // Authentication can recover in-place in Owlbear. Retain the exact
            // request, but never retry it until the player explicitly recovers.
            state.unconfirmedSave = { batch, body };
            state.awaitingAuth = true;
            state.halted = true;
            setSaveFailed(true);
            return;
          }
          if (status === 404 || status === 409) {
            state.unconfirmedSave = null;
            state.retryCount = 0;
            state.halted = true;
            setPending(() => []);
            state.optimisticCharacter = undefined;
            state.lastSavedCharacter = undefined;
            if (status === 404) {
              return;
            }
            // Index-based edits cannot be replayed safely on a different inventory.
            if (key) {
              void queryClient.invalidateQueries({ queryKey: key, exact: true });
            }
            showError(t('character.saveConflict', 'This character changed in another tab. Your latest edits were not saved. Reload before editing again.'));
            return;
          }
          const isTransient = status === undefined || status >= 500;
          if (isTransient) {
            state.unconfirmedSave = { batch, body };
            state.retryCount++;
            if (state.retryCount < maxRetries) {
              // Patches stay queued; onSettled re-flushes them (auto-retry).
              return;
            }

            // Out of retries: stop auto-reflush, surface a manual retry.
            state.halted = true;
            setSaveFailed(true);
            if (isUnexpectedApiError(error)) {
              showUnexpectedError(error, {
                source: 'character_save',
                characterId,
                operation: 'patch_character',
                locale,
              });
            }
            showError(
              getUserFacingApiErrorMessage(
                error,
                t,
                'Failed to save changes. Please try again.'
              ),
              {
                label: t('actions.retry', 'Retry'),
                onClick: retrySave,
              }
            );
            return;
          }

          // Client error (e.g. 4xx validation): retrying can't help. Drop the
          // bad batch, roll the cache back to the pre-patch snapshot, notify.
          state.unconfirmedSave = null;
          state.retryCount = 0;
          state.halted = true;
          setPending((prev) => prev.slice(batch.length));
          if (context?.previousCharacter) {
            const remaining = state.pending;
            const optimistic = remaining.reduce(
              (acc: CharacterResponse, patch) =>
                applyOptimisticPatch(acc, patch),
              context.previousCharacter as CharacterResponse
            );
            state.optimisticCharacter = optimistic;
            state.locale = locale;
            if (key) {
              queryClient.setQueryData(key, optimistic);
            }
          }
          showError(
            getUserFacingApiErrorMessage(
              error,
              t,
              'Failed to save changes. Please try again.'
            )
          );
        },
        onSettled: () => {
          state.flushing = false;
          if (state.halted || state.pending.length === 0) {
            const waiters = state.navigationWaiters.splice(0);
            waiters.forEach((resolve) => resolve(state.halted));
          }
          // Re-flush whatever is still queued (mid-flight edits, or a batch kept
          // for auto-retry) unless we've explicitly halted.
          const active = statesRef.current.get(activeCharacterIdRef.current);
          if (active && !active.halted && active.pending.length > 0) {
            debouncedFlush();
          }
        },
      }
    );
  };

  // useInsertionEffect fires synchronously before any DOM mutations, so
  // flushRef.current is always current by the time any event handler fires.
  useInsertionEffect(() => {
    activeCharacterIdRef.current = characterId;
    flushRef.current = flush;
  });

  const debouncedFlush = useDebouncedCallback(() => flushRef.current(), 1000);

  // The provider outlives sheet routes: hold navigation until the current queue saves.
  useEffect(() => {
    if (!characterId || readOnly) {
      return;
    }
    const state = getState();
    const waiters = state.navigationWaiters;
    const unblock = appHistory.block({
      enableBeforeUnload: false,
      blockerFn: () => {
        if (state.pending.length === 0) {
          return false;
        }
        if (state.awaitingAuth) {
          return true;
        }
        return new Promise<boolean>((resolve) => {
          waiters.push(resolve);
          flushRef.current();
        });
      },
    });
    return () => {
      unblock();
      waiters.splice(0).forEach((resolve) => resolve(true));
    };
  }, [characterId, readOnly, getState]);

  const hasPendingEdits = [...snapshots.values()].some((entry) => entry.pendingCount > 0);
  useEffect(() => {
    if (!hasPendingEdits) {
      return;
    }
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasPendingEdits]);

  // Flush any queued edit if we unmount mid-debounce (route change, logout) so
  // the last edit isn't silently dropped.
  useEffect(
    () => () => {
      debouncedFlush.flush();
    },
    [debouncedFlush]
  );

  const applyLocalPatch = (patch: OptimisticPatch) => {
    const state = getState();
    if (!characterId || readOnly) {
      return;
    }

    const base = getLatestOptimisticCharacter();
    const optimistic = base ? applyOptimisticPatch(base, patch) : undefined;
    state.optimisticCharacter = optimistic;
    state.locale = locale;

    const key = getActiveKey();
    if (!key) {
      return;
    }

    queryClient.setQueryData(
      key,
      (old: CharacterResponse | undefined) =>
        old ? applyOptimisticPatch(old, patch) : optimistic
    );
  };

  const queuePatch = (patch: OptimisticPatch) => {
    const state = getState();
    if (!characterId || readOnly) {
      return;
    }

    // A fresh edit resumes saving even if a prior batch had halted.
    if (!state.awaitingAuth) {
      state.halted = false;
      setSaveFailed(false);
    }
    adoptNewerCachedCharacter();
    setPending((prev) => [...prev, patch]);
    applyLocalPatch(patch);

    if (!state.awaitingAuth) {
      debouncedFlush();
    }
  };

  // Simple field updates
  const updateField = (field: SimpleField, value: number | string) => {
    const issueMessage = getSimpleFieldLimitMessage(t, field, value);
    const validationId = getSimpleFieldValidationId(field);

    if (issueMessage) {
      if (
        shownFieldValidationMessagesRef.current[validationId] !==
        issueMessage
      ) {
        shownFieldValidationMessagesRef.current[validationId] = issueMessage;
        showError(issueMessage);
      }
      validationIssues?.clearValidationIssue?.(validationId);
      return;
    }

    delete shownFieldValidationMessagesRef.current[validationId];
    validationIssues?.clearValidationIssue?.(validationId);
    queuePatch({
      kind: 'simple',
      field,
      value: sanitizeSimpleFieldValue(field, value),
    });
  };

  // Armor updates
  const updateArmorField = (field: string, value: string | number) => {
    queuePatch({ kind: 'armor', field, value });
  };

  // Weapon updates
  const updateWeaponField = (index: number, field: string, value: string) => {
    queuePatch({ kind: 'weapon', index, field, value });
  };

  // Abilities updates
  const updateAbilities = (
    abilities: {
      key?: string;
      name?: string;
      description?: string;
      comment?: string;
    }[]
  ) => {
    queuePatch({ kind: 'abilities', abilities });
  };

  // Equipment operations
  const updateEquipmentItem = (index: number, item: EquipmentItem) => {
    queuePatch({ kind: 'equipment-item', index, item });
  };

  const addEquipmentItem = (item: EquipmentItem) => {
    queuePatch({ kind: 'equipment-add', item });
  };

  const removeEquipmentItem = (index: number) => {
    queuePatch({ kind: 'equipment-remove', index });
  };

  const moveEquipmentItem = (from: number, to: number) => {
    queuePatch({ kind: 'equipment-move', from, to });
  };

  // Storage operations
  const updateStorageItem = (index: number, item: EquipmentItem) => {
    queuePatch({ kind: 'storage-item', index, item });
  };

  const addStorageItem = (item: EquipmentItem) => {
    queuePatch({ kind: 'storage-add', item });
  };

  const removeStorageItem = (index: number) => {
    queuePatch({ kind: 'storage-remove', index });
  };

  // Cross-container operations
  const moveToStorage = (equipmentIndex: number) => {
    queuePatch({ kind: 'move-to-storage', equipmentIndex });
  };

  const moveToEquipment = (storageIndex: number, equipmentPosition?: number) => {
    queuePatch({
      kind: 'move-to-equipment',
      storageIndex,
      equipmentPosition,
    });
  };

  const swapEquipmentStorage = (equipmentIndex: number, storageIndex: number) => {
    queuePatch({
      kind: 'swap-equipment-storage',
      equipmentIndex,
      storageIndex,
    });
  };

  const toggleScrollUse = (equipmentIndex: number, useIndex: number) => {
    queuePatch({ kind: 'toggle-scroll-use', equipmentIndex, useIndex });
  };

  const consumeAmmo = (equipmentIndex: number) => {
    queuePatch({ kind: 'ammo-use', equipmentIndex });
  };

  const equipWeapon = (equipmentIndex: number, slotIndex: number) => {
    queuePatch({ kind: 'equip-weapon', equipmentIndex, slotIndex });
  };

  const unequipWeapon = (slotIndex: number) => {
    queuePatch({ kind: 'unequip-weapon', slotIndex });
  };

  const equipArmor = (equipmentIndex: number) => {
    queuePatch({ kind: 'equip-armor', equipmentIndex });
  };

  const unequipArmor = () => {
    queuePatch({ kind: 'unequip-armor' });
  };

  // Modifier operations
  const addModifier = (modifier: CustomModifier) => {
    queuePatch({ kind: 'modifier-add', modifier });
  };

  const removeModifier = (modifierId: string) => {
    queuePatch({ kind: 'modifier-remove', modifierId });
  };

  const updateModifier = (modifierId: string, modifier: Partial<CustomModifier>) => {
    queuePatch({ kind: 'modifier-update', modifierId, modifier });
  };

  return {
    queuePatch,
    flush,

    toggleScrollUse,
    consumeAmmo,

    // Simple fields
    updateField,

    // Armor & Weapons
    updateArmorField,
    updateWeaponField,

    // Abilities
    updateAbilities,

    // Equipment
    updateEquipmentItem,
    addEquipmentItem,
    removeEquipmentItem,
    moveEquipmentItem,

    // Storage
    updateStorageItem,
    addStorageItem,
    removeStorageItem,

    // Cross-container moves
    moveToStorage,
    moveToEquipment,
    swapEquipmentStorage,

    equipWeapon,
    unequipWeapon,
    equipArmor,
    unequipArmor,

    // Modifiers
    addModifier,
    removeModifier,
    updateModifier,

    // Saving while patches are queued or a PATCH is in flight.
    isSaving: !snapshot?.saveFailed && ((snapshot?.pendingCount ?? 0) > 0 || updateCharacter.isPending),
    saveFailed: snapshot?.saveFailed ?? false,
    retrySave,

    getVisibleCharacter: (character: CharacterResponse | undefined) => {
      const state = getState();
      if (state.pending.length > 0) {
        return state.optimisticCharacter ?? character;
      }

      const lastSaved = state.locale === locale ? state.lastSavedCharacter : undefined;
      if (isNewerThan(lastSaved, character)) {
        return lastSaved;
      }

      return character ?? lastSaved;
    },
  };
}
