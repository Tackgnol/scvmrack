import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type ComputedModifier, type CustomModifier } from '@/hooks/models';
import {
  allIncludeOptions,
  scopeIncludeOptions,
} from '@components/modifiers/config';
import {
  createModifierId,
  excludeToIncludes,
  includesToExclude,
  resolveScopeFromIncludes,
} from '@components/modifiers/utils';
import {
  type IncludeContext,
  type LocalStatistic,
  type ScopeOption,
} from '@components/modifiers/types';
import {
  getModifierValueLimitMessage,
  getModifierValueLimitIssue,
  getTextLimitIssue,
  getTextLimitMessage,
  isCompleteFiniteModifierValueInput,
  sanitizeModifierValue,
} from '@/validation/characterUpdate';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const REMOVE_ANIMATION_MS = 220;
const SHIFT_BADGE_TIMEOUT_MS = 900;
const QUICK_MODIFIER_NAME_ISSUE_ID = 'modifier:quick:name';
const QUICK_MODIFIER_VALUE_ISSUE_ID = 'modifier:quick:value';
const MODAL_MODIFIER_NAME_ISSUE_ID = 'modifier:modal:name';
const MODAL_MODIFIER_VALUE_ISSUE_ID = 'modifier:modal:value';
const MODAL_MODIFIER_COMMENT_ISSUE_ID = 'modifier:modal:comment';

export function useModifiersPanel() {
  const {
    character,
    addModifier,
    removeModifier,
    updateModifier,
    setValidationIssue,
    clearValidationIssue,
  } = useCharacter();
  const { t } = useTranslation();
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [modifierShiftLabel, setModifierShiftLabel] = useState<string | null>(
    null
  );
  const computedFingerprintRef = useRef<string | null>(null);
  const shiftTimeoutRef = useRef<number | null>(null);
  const removeTimeoutsRef = useRef<number[]>([]);

  const [name, setName] = useState('');
  const [stat, setStat] = useState<LocalStatistic>('agility');
  const [valueStr, setValueStr] = useState('');
  const [scope, setScope] = useState<ScopeOption>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalStat, setModalStat] = useState<LocalStatistic>('agility');
  const [modalValueStr, setModalValueStr] = useState('');
  const [modalComment, setModalComment] = useState('');
  const [modalScope, setModalScope] = useState<ScopeOption>('all');
  const [modalIncludes, setModalIncludes] = useState<IncludeContext[]>([]);
  const [editingModifierId, setEditingModifierId] = useState<string | null>(
    null
  );
  const [removingModifierIds, setRemovingModifierIds] = useState<string[]>([]);

  const [computedModalOpen, setComputedModalOpen] = useState(false);
  const [selectedComputedModifier, setSelectedComputedModifier] =
    useState<ComputedModifier | null>(null);

  const customModifiers = character?.modifiers ?? [];
  const computedModifiers = character?.computedModifiers ?? [];
  const quickNameIssue = getTextLimitIssue('modifierName', name);
  const quickValueIssue = getModifierValueLimitIssue(valueStr);
  const modalNameIssue = getTextLimitIssue('modifierName', modalName);
  const modalValueIssue = getModifierValueLimitIssue(modalValueStr);
  const modalCommentIssue = getTextLimitIssue(
    'modifierComment',
    modalComment
  );
  const quickNameIssueMessage = getTextLimitMessage(
    t,
    'modifierName',
    name
  );
  const quickValueIssueMessage = getModifierValueLimitMessage(t, valueStr);
  const modalNameIssueMessage = getTextLimitMessage(
    t,
    'modifierName',
    modalName
  );
  const modalValueIssueMessage = getModifierValueLimitMessage(t, modalValueStr);
  const modalCommentIssueMessage = getTextLimitMessage(
    t,
    'modifierComment',
    modalComment
  );
  const canSubmitQuickValue = isCompleteFiniteModifierValueInput(valueStr);
  const canSubmitModalValue = isCompleteFiniteModifierValueInput(modalValueStr);
  const quickValue = sanitizeModifierValue(valueStr);
  const modalValue = sanitizeModifierValue(modalValueStr);

  const computedFingerprint = computedModifiers
    .map(
      (modifier) =>
        `${modifier.originKey ?? modifier.originName ?? 'origin'}:${modifier.statistic ?? 'stat'}:${modifier.value ?? 0}:${(modifier.exclude ?? []).join('.')}`
    )
    .join('|');

  const computedTotal = computedModifiers.reduce(
    (sum, modifier) => sum + (modifier.value ?? 0),
    0
  );

  useEffect(() => {
    if (computedFingerprintRef.current === null) {
      computedFingerprintRef.current = computedFingerprint;
      return;
    }

    if (computedFingerprintRef.current === computedFingerprint) return;
    computedFingerprintRef.current = computedFingerprint;

    const label =
      computedTotal < 0
        ? t('modifiers.shiftNegative', 'Curses shift')
        : computedTotal > 0
          ? t('modifiers.shiftPositive', 'Blessings shift')
          : t('modifiers.shiftNeutral', 'Fates shift');

    setModifierShiftLabel(label);
    if (shiftTimeoutRef.current) {
      window.clearTimeout(shiftTimeoutRef.current);
    }
    shiftTimeoutRef.current = window.setTimeout(
      () => setModifierShiftLabel(null),
      SHIFT_BADGE_TIMEOUT_MS
    );
  }, [computedFingerprint, computedTotal, t]);

  useEffect(
    () => () => {
      removeTimeoutsRef.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
      removeTimeoutsRef.current = [];
      if (shiftTimeoutRef.current) {
        window.clearTimeout(shiftTimeoutRef.current);
        shiftTimeoutRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (quickNameIssueMessage) {
      setValidationIssue?.(QUICK_MODIFIER_NAME_ISSUE_ID, quickNameIssueMessage);
      return;
    }

    clearValidationIssue?.(QUICK_MODIFIER_NAME_ISSUE_ID);
  }, [clearValidationIssue, quickNameIssueMessage, setValidationIssue]);

  useEffect(() => {
    if (quickValueIssueMessage) {
      setValidationIssue?.(
        QUICK_MODIFIER_VALUE_ISSUE_ID,
        quickValueIssueMessage
      );
      return;
    }

    clearValidationIssue?.(QUICK_MODIFIER_VALUE_ISSUE_ID);
  }, [clearValidationIssue, quickValueIssueMessage, setValidationIssue]);

  useEffect(() => {
    if (modalOpen && modalNameIssueMessage) {
      setValidationIssue?.(MODAL_MODIFIER_NAME_ISSUE_ID, modalNameIssueMessage);
      return;
    }

    clearValidationIssue?.(MODAL_MODIFIER_NAME_ISSUE_ID);
  }, [
    clearValidationIssue,
    modalNameIssueMessage,
    modalOpen,
    setValidationIssue,
  ]);

  useEffect(() => {
    if (modalOpen && modalValueIssueMessage) {
      setValidationIssue?.(
        MODAL_MODIFIER_VALUE_ISSUE_ID,
        modalValueIssueMessage
      );
      return;
    }

    clearValidationIssue?.(MODAL_MODIFIER_VALUE_ISSUE_ID);
  }, [
    clearValidationIssue,
    modalOpen,
    modalValueIssueMessage,
    setValidationIssue,
  ]);

  useEffect(() => {
    if (modalOpen && modalCommentIssueMessage) {
      setValidationIssue?.(
        MODAL_MODIFIER_COMMENT_ISSUE_ID,
        modalCommentIssueMessage
      );
      return;
    }

    clearValidationIssue?.(MODAL_MODIFIER_COMMENT_ISSUE_ID);
  }, [
    clearValidationIssue,
    modalCommentIssueMessage,
    modalOpen,
    setValidationIssue,
  ]);

  const resetQuickForm = () => {
    setName('');
    setStat('agility');
    setValueStr('');
    setScope('all');
  };

  const closeAdvancedModal = () => {
    setModalOpen(false);
    setEditingModifierId(null);
    clearValidationIssue?.(MODAL_MODIFIER_NAME_ISSUE_ID);
    clearValidationIssue?.(MODAL_MODIFIER_VALUE_ISSUE_ID);
    clearValidationIssue?.(MODAL_MODIFIER_COMMENT_ISSUE_ID);
  };

  const openAdvancedModal = () => {
    const scopeConfig = scopeIncludeOptions.find(
      (option) => option.value === scope
    );
    setEditingModifierId(null);
    setModalName(name.trim());
    setModalStat(stat);
    setModalValueStr(valueStr);
    setModalComment('');
    setModalScope(scope);
    setModalIncludes(scopeConfig?.include ?? []);
    setModalOpen(true);
  };

  const openEditModifierModal = (modifier: CustomModifier) => {
    const includes = excludeToIncludes(modifier.exclude ?? []);
    const valueAsString =
      modifier.value === undefined || modifier.value === null
        ? ''
        : String(modifier.value);

    setEditingModifierId(modifier.id ?? null);
    setModalName(modifier.name ?? '');
    setModalStat((modifier.statistic ?? 'agility') as LocalStatistic);
    setModalValueStr(valueAsString);
    setModalComment(modifier.comment ?? '');
    setModalScope(resolveScopeFromIncludes(includes));
    setModalIncludes(includes);
    setModalOpen(true);
  };

  const handleQuickAdd = () => {
    if (
      !name.trim() ||
      quickNameIssue ||
      quickValueIssue ||
      !canSubmitQuickValue
    ) {
      return;
    }

    const scopeConfig = scopeIncludeOptions.find(
      (option) => option.value === scope
    );
    const modifier: CustomModifier = {
      id: createModifierId(),
      name: name.trim(),
      value: quickValue,
      source: 'Player',
      statistic: stat as CustomModifier['statistic'],
      exclude: includesToExclude(scopeConfig?.include ?? []),
    };

    addModifier(modifier);
    resetQuickForm();
  };

  const handleModalScopeChange = (newScope: ScopeOption) => {
    const scopeConfig = scopeIncludeOptions.find(
      (option) => option.value === newScope
    );
    setModalScope(newScope);
    setModalIncludes(scopeConfig?.include ?? []);
  };

  const toggleModalInclude = (context: IncludeContext, checked: boolean) => {
    setModalIncludes((previous) => {
      if (checked) {
        return previous.includes(context) ? previous : [...previous, context];
      }
      return previous.filter((value) => value !== context);
    });
  };

  const saveAdvancedModifier = () => {
    if (
      !modalName.trim() ||
      modalNameIssue ||
      modalValueIssue ||
      modalCommentIssue ||
      !canSubmitModalValue
    ) {
      return;
    }

    const modifierPayload: CustomModifier = {
      name: modalName.trim(),
      value: modalValue,
      source: 'Player',
      statistic: modalStat as CustomModifier['statistic'],
      exclude: includesToExclude(modalIncludes),
      comment: modalComment.trim() || undefined,
    };

    if (editingModifierId) {
      updateModifier(editingModifierId, modifierPayload);
    } else {
      addModifier({
        id: createModifierId(),
        ...modifierPayload,
      });
    }

    closeAdvancedModal();
  };

  const removeCustomModifier = (modifierId?: string) => {
    if (!modifierId || removingModifierIds.includes(modifierId)) return;

    setRemovingModifierIds((previous) => [...previous, modifierId]);
    const timeoutId = window.setTimeout(() => {
      removeModifier(modifierId);
      setRemovingModifierIds((previous) =>
        previous.filter((id) => id !== modifierId)
      );
      removeTimeoutsRef.current = removeTimeoutsRef.current.filter(
        (id) => id !== timeoutId
      );
    }, REMOVE_ANIMATION_MS);

    removeTimeoutsRef.current.push(timeoutId);
  };

  const openComputedModifierModal = (modifier: ComputedModifier) => {
    setSelectedComputedModifier(modifier);
    setComputedModalOpen(true);
  };

  const closeComputedModifierModal = () => {
    setComputedModalOpen(false);
    setSelectedComputedModifier(null);
  };

  return {
    state: {
      prefersReducedMotion,
      modifierShiftLabel,
      quickForm: {
        name,
        stat,
        valueStr,
        scope,
        nameErrorMessage: quickNameIssueMessage,
        valueErrorMessage: quickValueIssueMessage,
        canSubmit:
          Boolean(name.trim()) &&
          !quickNameIssue &&
          !quickValueIssue &&
          canSubmitQuickValue,
      },
      customModifiers,
      computedModifiers,
      removingModifierIds,
      advancedModal: {
        open: modalOpen,
        isEditing: editingModifierId !== null,
        canSave:
          Boolean(modalName.trim()) &&
          !modalNameIssue &&
          !modalValueIssue &&
          !modalCommentIssue &&
          canSubmitModalValue,
        name: modalName,
        stat: modalStat,
        valueStr: modalValueStr,
        comment: modalComment,
        nameErrorMessage: modalNameIssueMessage,
        valueErrorMessage: modalValueIssueMessage,
        commentErrorMessage: modalCommentIssueMessage,
        scope: modalScope,
        includes: modalIncludes,
      },
      computedModal: {
        open: computedModalOpen,
        selectedModifier: selectedComputedModifier,
      },
    },
    actions: {
      setName,
      setStat,
      setValueStr,
      setScope,
      openAdvancedModal,
      openEditModifierModal,
      closeAdvancedModal,
      setModalName,
      setModalStat,
      setModalValueStr,
      setModalComment,
      handleModalScopeChange,
      toggleModalInclude,
      handleQuickAdd,
      saveAdvancedModifier,
      removeCustomModifier,
      openComputedModifierModal,
      closeComputedModifierModal,
    },
    labels: {
      allIncludeOptions,
    },
  };
}
