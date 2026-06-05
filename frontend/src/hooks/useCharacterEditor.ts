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
import { useInsertionEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import {
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
  const [pending, setPending] = useState<OptimisticPatch[]>([]);
  const { showError } = useSnackbar();
  const { showUnexpectedError } = useErrorFeedback();
  const { t } = useTranslation();
  const shownFieldValidationMessagesRef = useRef<Record<string, string>>({});

  // Retry tracking
  const retryCountRef = useRef(0);
  const flushRef = useRef<() => void>(() => {});
  const maxRetries = 3;

  const flush = () => {
    if (!characterId || pending.length === 0) return;

    const currentCharacter = queryClient.getQueryData<CharacterResponse>(
      getCharacterKey(characterId, locale)
    );

    if (!currentCharacter) return;

    // Build request body from patches + current state
    const body = buildRequestFromPatches(pending, currentCharacter);

    // Capture the batch now — setPending([]) below clears state
    // asynchronously, but we need the snapshot for analytics.
    const flushedPatches = [...pending];

    updateCharacter.mutate(
      {
        params: { path: { id: characterId } },
        body: body as any,
      },
      {
        onSuccess: () => {
          retryCountRef.current = 0;
          trackCharacterEdited(flushedPatches, locale ?? 'en');
          // Refetch so server-hydrated fields (e.g. consumable `uses` derived
          // from default_amount + presence) replace the optimistic stand-in.
          if (flushedPatches.some((p) => p.kind === 'equipment-add')) {
            queryClient.invalidateQueries({
              queryKey: getCharacterKey(characterId, locale),
            });
          }
        },
        onError: (error: any) => {
          console.error('Failed to save:', error);
          retryCountRef.current++;

          if (isApiRateLimited(error)) {
            showError(
              t('auth.rateLimit', 'Too many requests. Please try again later.')
            );
            return;
          }

          if (isUnexpectedApiError(error)) {
            if (retryCountRef.current < maxRetries) {
              return;
            }

            showUnexpectedError(error, {
              source: 'character_save',
              characterId,
              operation: 'patch_character',
              locale,
            });
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
                  flushRef.current();
                },
              }
            );
            return;
          }

          if (retryCountRef.current >= maxRetries) {
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
                  flushRef.current();
                },
              }
            );
          }
        },
      }
    );

    setPending([]);
  };

  // useInsertionEffect fires synchronously before any DOM mutations, so
  // flushRef.current is always current by the time any event handler fires.
  useInsertionEffect(() => {
    flushRef.current = flush;
  });

  const debouncedFlush = useDebouncedCallback(flush, 1000);

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

    // Original isSaving logic preserved
    isSaving: pending.length > 0 || updateCharacter.isPending,
  };
}
