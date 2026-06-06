import { trackCharacterEdited } from '@/analytics/characterAnalytics';
import { $api } from '@/api';
import { applyOptimisticPatch } from '@/hooks/applyOptimisticPatch.ts';
import {
  CharacterResponse,
  CustomModifier,
  EquipmentItem,
  OptimisticPatch,
  SimpleField,
} from '@/hooks/models.ts';
import { buildRequestFromPatches } from '@/hooks/patchToRequest.ts';
import {
  getSimpleFieldLimitMessage,
  sanitizeSimpleFieldValue,
} from '@/validation/characterUpdate';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useInsertionEffect, useRef, useState } from 'react';
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

export function useCharacterEditor(
  characterId: string | null,
  updateCharacter: ReturnType<typeof $api.useMutation>,
  getCharacterKey: (id: string, locale?: string) => readonly unknown[],
  locale?: string,
  validationIssues?: ValidationIssueHandlers
) {
  const queryClient = useQueryClient();
  const { showError } = useSnackbar();
  const { showUnexpectedError } = useErrorFeedback();
  const { t } = useTranslation();
  const shownFieldValidationMessagesRef = useRef<Record<string, string>>({});

  // Pending patch queue. The ref is the source of truth so async mutation
  // callbacks never read a stale closure; the count drives `isSaving` renders.
  const pendingRef = useRef<OptimisticPatch[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const setPending = (
    updater: (prev: OptimisticPatch[]) => OptimisticPatch[]
  ) => {
    pendingRef.current = updater(pendingRef.current);
    setPendingCount(pendingRef.current.length);
  };

  // Retry tracking
  const retryCountRef = useRef(0);
  const flushRef = useRef<() => void>(() => {});
  // Serializes flushes (one PATCH in flight at a time) and halts auto-reflush
  // once we've given up / hit a client error, so we never busy-loop the server.
  const flushingRef = useRef(false);
  const haltRef = useRef(false);
  const maxRetries = 3;

  const flush = () => {
    if (!characterId) return;
    // One PATCH in flight at a time; onSettled re-flushes whatever remains.
    if (flushingRef.current || updateCharacter.isPending) return;

    const batch = [...pendingRef.current];
    if (batch.length === 0) return;

    const key = getCharacterKey(characterId, locale);
    const currentCharacter = queryClient.getQueryData<CharacterResponse>(key);
    if (!currentCharacter) return;

    // Build request body from the queued patches + the current optimistic state.
    const body = buildRequestFromPatches(batch, currentCharacter);
    flushingRef.current = true;

    updateCharacter.mutate(
      {
        params: { path: { id: characterId } },
        body: body as any,
      },
      {
        onSuccess: (serverCharacter: unknown) => {
          retryCountRef.current = 0;
          haltRef.current = false;
          trackCharacterEdited(batch, locale ?? 'en');

          // Drop exactly the patches we sent (a prefix of the queue); anything
          // queued during the flight stays pending.
          setPending((prev) => prev.slice(batch.length));

          // The PATCH response is server-authoritative and already hydrated.
          // Write it to cache, then re-apply patches that arrived mid-flight so
          // their optimistic state survives.
          const server = serverCharacter as CharacterResponse | undefined;
          if (server) {
            const remaining = pendingRef.current;
            queryClient.setQueryData<CharacterResponse>(key, () =>
              remaining.reduce(
                (acc, patch) => applyOptimisticPatch(acc, patch),
                server
              )
            );
          }
        },
        onError: (error: any, _vars: unknown, context: any) => {
          if (isApiRateLimited(error)) {
            // Keep the batch queued (don't lose the edit) but stop hammering the
            // limiter — the next edit or unmount will flush it again.
            haltRef.current = true;
            showError(
              t('auth.rateLimit', 'Too many requests. Please try again later.')
            );
            return;
          }

          // Transient = server error (5xx) or a network failure (no status).
          // Both are worth retrying; the queued batch is kept and onSettled
          // re-flushes it until we run out of attempts.
          const status = getApiErrorStatus(error);
          const isTransient = status === undefined || status >= 500;
          if (isTransient) {
            retryCountRef.current++;
            if (retryCountRef.current < maxRetries) {
              // Patches stay queued; onSettled re-flushes them (auto-retry).
              return;
            }

            // Out of retries: stop auto-reflush, surface a manual retry.
            haltRef.current = true;
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
                onClick: () => {
                  retryCountRef.current = 0;
                  haltRef.current = false;
                  flushRef.current();
                },
              }
            );
            return;
          }

          // Client error (e.g. 4xx validation): retrying can't help. Drop the
          // bad batch, roll the cache back to the pre-patch snapshot, notify.
          retryCountRef.current = 0;
          haltRef.current = true;
          setPending((prev) => prev.slice(batch.length));
          if (context?.previousCharacter) {
            queryClient.setQueryData(key, context.previousCharacter);
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
          flushingRef.current = false;
          // Re-flush whatever is still queued (mid-flight edits, or a batch kept
          // for auto-retry) unless we've explicitly halted.
          if (!haltRef.current && pendingRef.current.length > 0) {
            debouncedFlush();
          }
        },
      }
    );
  };

  // useInsertionEffect fires synchronously before any DOM mutations, so
  // flushRef.current is always current by the time any event handler fires.
  useInsertionEffect(() => {
    flushRef.current = flush;
  });

  const debouncedFlush = useDebouncedCallback(flush, 1000);

  // Flush any queued edit if we unmount mid-debounce (route change, logout) so
  // the last edit isn't silently dropped.
  useEffect(
    () => () => {
      debouncedFlush.flush();
    },
    [debouncedFlush]
  );

  const applyLocalPatch = (patch: OptimisticPatch) => {
    if (!characterId) return;

    queryClient.setQueryData(
      getCharacterKey(characterId, locale),
      (old: CharacterResponse | undefined) =>
        old ? applyOptimisticPatch(old, patch) : old
    );
  };

  const queuePatch = (patch: OptimisticPatch) => {
    if (!characterId) return;

    // A fresh edit resumes saving even if a prior batch had halted.
    haltRef.current = false;
    setPending((prev) => [...prev, patch]);
    applyLocalPatch(patch);

    debouncedFlush();
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
    isSaving: pendingCount > 0 || updateCharacter.isPending,
  };
}
