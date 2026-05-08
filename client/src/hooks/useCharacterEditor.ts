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
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

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
  const { t } = useTranslation();

  // Retry tracking
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const flush = useCallback(() => {
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

          const isRateLimit =
            error?.statusCode === 429 ||
            error?.status === 429 ||
            error?.message === 'RATE_LIMIT_EXCEEDED';
          if (isRateLimit) {
            showError(
              t('auth.rateLimit', 'Too many requests. Please try again later.')
            );
            return;
          }

          if (retryCountRef.current >= maxRetries) {
            showError(
              t(
                'characters.saveError',
                'Failed to save changes. Please try again.'
              ),
              {
                label: t('actions.retry', 'Retry'),
                onClick: () => {
                  retryCountRef.current = 0;
                  flush();
                },
              }
            );
          }
        },
      }
    );

    setPending([]);
  }, [
    characterId,
    pending,
    updateCharacter,
    queryClient,
    getCharacterKey,
    locale,
    showError,
    t,
  ]);

  const debouncedFlush = useDebouncedCallback(flush, 1000);

  const applyLocalPatch = useCallback(
    (patch: OptimisticPatch) => {
      if (!characterId) return;

      queryClient.setQueryData(
        getCharacterKey(characterId, locale),
        (old: CharacterResponse | undefined) =>
          old ? applyOptimisticPatch(old, patch) : old
      );
    },
    [characterId, queryClient, getCharacterKey, locale]
  );

  const queuePatch = useCallback(
    (patch: OptimisticPatch) => {
      if (!characterId) return;

      setPending((prev) => [...prev, patch]);
      applyLocalPatch(patch);

      debouncedFlush();
    },
    [characterId, applyLocalPatch, debouncedFlush]
  );

  // Simple field updates
  const updateField = useCallback(
    (field: SimpleField, value: number | string) => {
      const issueMessage = getSimpleFieldLimitMessage(t, field, value);
      const validationId = getSimpleFieldValidationId(field);

      if (issueMessage) {
        validationIssues?.setValidationIssue?.(validationId, issueMessage);
        applyLocalPatch({ kind: 'simple', field, value });
        return;
      }

      validationIssues?.clearValidationIssue?.(validationId);
      queuePatch({
        kind: 'simple',
        field,
        value: sanitizeSimpleFieldValue(field, value),
      });
    },
    [applyLocalPatch, queuePatch, t, validationIssues]
  );

  // Armor updates
  const updateArmorField = useCallback(
    (field: string, value: string | number) => {
      queuePatch({ kind: 'armor', field, value });
    },
    [queuePatch]
  );

  // Weapon updates
  const updateWeaponField = useCallback(
    (index: number, field: string, value: string) => {
      queuePatch({ kind: 'weapon', index, field, value });
    },
    [queuePatch]
  );

  // Abilities updates
  const updateAbilities = useCallback(
    (
      abilities: {
        key?: string;
        name?: string;
        description?: string;
        comment?: string;
      }[]
    ) => {
      queuePatch({ kind: 'abilities', abilities });
    },
    [queuePatch]
  );

  // Equipment operations
  const updateEquipmentItem = useCallback(
    (index: number, item: EquipmentItem) => {
      queuePatch({ kind: 'equipment-item', index, item });
    },
    [queuePatch]
  );

  const addEquipmentItem = useCallback(
    (item: EquipmentItem) => {
      queuePatch({ kind: 'equipment-add', item });
    },
    [queuePatch]
  );

  const removeEquipmentItem = useCallback(
    (index: number) => {
      queuePatch({ kind: 'equipment-remove', index });
    },
    [queuePatch]
  );

  const moveEquipmentItem = useCallback(
    (from: number, to: number) => {
      queuePatch({ kind: 'equipment-move', from, to });
    },
    [queuePatch]
  );

  // Storage operations
  const updateStorageItem = useCallback(
    (index: number, item: EquipmentItem) => {
      queuePatch({ kind: 'storage-item', index, item });
    },
    [queuePatch]
  );

  const addStorageItem = useCallback(
    (item: EquipmentItem) => {
      queuePatch({ kind: 'storage-add', item });
    },
    [queuePatch]
  );

  const removeStorageItem = useCallback(
    (index: number) => {
      queuePatch({ kind: 'storage-remove', index });
    },
    [queuePatch]
  );

  // Cross-container operations
  const moveToStorage = useCallback(
    (equipmentIndex: number) => {
      queuePatch({ kind: 'move-to-storage', equipmentIndex });
    },
    [queuePatch]
  );

  const moveToEquipment = useCallback(
    (storageIndex: number, equipmentPosition?: number) => {
      queuePatch({
        kind: 'move-to-equipment',
        storageIndex,
        equipmentPosition,
      });
    },
    [queuePatch]
  );

  const swapEquipmentStorage = useCallback(
    (equipmentIndex: number, storageIndex: number) => {
      queuePatch({
        kind: 'swap-equipment-storage',
        equipmentIndex,
        storageIndex,
      });
    },
    [queuePatch]
  );

  const toggleScrollUse = useCallback(
    (equipmentIndex: number, useIndex: number) => {
      queuePatch({ kind: 'toggle-scroll-use', equipmentIndex, useIndex });
    },
    [queuePatch]
  );

  const useAmmo = useCallback(
    (equipmentIndex: number) => {
      queuePatch({ kind: 'ammo-use', equipmentIndex });
    },
    [queuePatch]
  );

  const equipWeapon = useCallback(
    (equipmentIndex: number, slotIndex: number) => {
      queuePatch({ kind: 'equip-weapon', equipmentIndex, slotIndex });
    },
    [queuePatch]
  );

  const unequipWeapon = useCallback(
    (slotIndex: number) => {
      queuePatch({ kind: 'unequip-weapon', slotIndex });
    },
    [queuePatch]
  );

  const equipArmor = useCallback(
    (equipmentIndex: number) => {
      queuePatch({ kind: 'equip-armor', equipmentIndex });
    },
    [queuePatch]
  );

  const unequipArmor = useCallback(() => {
    queuePatch({ kind: 'unequip-armor' });
  }, [queuePatch]);

  // Modifier operations
  const addModifier = useCallback(
    (modifier: CustomModifier) => {
      queuePatch({ kind: 'modifier-add', modifier });
    },
    [queuePatch]
  );

  const removeModifier = useCallback(
    (modifierId: string) => {
      queuePatch({ kind: 'modifier-remove', modifierId });
    },
    [queuePatch]
  );

  const updateModifier = useCallback(
    (modifierId: string, modifier: Partial<CustomModifier>) => {
      queuePatch({ kind: 'modifier-update', modifierId, modifier });
    },
    [queuePatch]
  );

  return {
    queuePatch,
    flush,

    toggleScrollUse,
    useAmmo,

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
