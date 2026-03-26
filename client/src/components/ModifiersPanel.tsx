import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { CustomModifier, ComputedModifier } from '@/hooks/models';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  Checkbox,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { customStyles, morkBorgColors } from '../theme/morkBorgTheme';
import MorkBorgModal from './MorkBorgModal';

const modifiersTitleStyle = {
  ...customStyles.abilities.title,
  transform: 'rotate(0.5deg)',
};

// Local type aliases for cleaner code
type LocalStatistic = 'agility' | 'strength' | 'presence' | 'toughness';

const statOptions: { value: LocalStatistic; label: string }[] = [
  { value: 'agility', label: 'AGI' },
  { value: 'strength', label: 'STR' },
  { value: 'presence', label: 'PRE' },
  { value: 'toughness', label: 'TOU' },
];

// All possible contexts for checkbox (what it can apply to)
const allIncludeOptions = [
  { value: 'melee', labelKey: 'modifiers.exclude.melee' },
  { value: 'ranged', labelKey: 'modifiers.exclude.ranged' },
  { value: 'defence', labelKey: 'modifiers.exclude.defence' },
  { value: 'cast', labelKey: 'modifiers.exclude.cast' },
  { value: 'ability', labelKey: 'modifiers.exclude.ability' },
];

const ALL_CONTEXTS = allIncludeOptions.map((opt) => opt.value);

// Scope to INCLUDE mapping (what this applies TO)
type ScopeOption = 'all' | 'combat' | 'defence' | 'melee' | 'ranged' | 'powers';

const scopeIncludeOptions: {
  value: ScopeOption;
  labelKey: string;
  include: string[];
}[] = [
  {
    value: 'all',
    labelKey: 'modifiers.scopes.all',
    include: [...ALL_CONTEXTS],
  },
  {
    value: 'combat',
    labelKey: 'modifiers.scopes.combat',
    include: ['melee', 'ranged', 'cast'],
  },
  {
    value: 'defence',
    labelKey: 'modifiers.scopes.defence',
    include: ['defence'],
  },
  { value: 'melee', labelKey: 'modifiers.scopes.melee', include: ['melee'] },
  { value: 'ranged', labelKey: 'modifiers.scopes.ranged', include: ['ranged'] },
  { value: 'powers', labelKey: 'modifiers.scopes.powers', include: ['cast'] },
];

const valuePulse = keyframes`
  0% { transform: scale(1); }
  60% { transform: scale(1.04); }
  100% { transform: scale(1); }
`;

const shiftBadge = keyframes`
  0% { opacity: 0; transform: translateY(-6px) scale(0.98); }
  20% { opacity: 1; transform: translateY(0) scale(1); }
  80% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(4px) scale(0.98); }
`;

function CustomModifierTag({
  modifier,
  onRemove,
  onEdit,
  isFull,
  removeLabel,
  reduceMotion,
}: {
  modifier: CustomModifier;
  onRemove: () => void;
  onEdit: () => void;
  isFull: boolean;
  removeLabel: string;
  reduceMotion?: boolean;
}) {
  const isNegative = (modifier.value ?? 0) < 0;
  const [pulse, setPulse] = useState(false);
  const previousValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const nextValue = modifier.value ?? 0;
    if (previousValueRef.current === null) {
      previousValueRef.current = nextValue;
      return;
    }
    if (previousValueRef.current !== nextValue) {
      setPulse(true);
      const timeoutId = window.setTimeout(() => setPulse(false), 180);
      previousValueRef.current = nextValue;
      return () => window.clearTimeout(timeoutId);
    }
    previousValueRef.current = nextValue;
  }, [modifier.value, reduceMotion]);

  return (
    <Box
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: isFull ? 'wrap' : 'nowrap',
        columnGap: 0.75,
        rowGap: 0.55,
        bgcolor: morkBorgColors.grey,
        border: `2px solid ${morkBorgColors.yellow}`,
        p: 1,
        minHeight: 56,
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `2px 2px 0 ${morkBorgColors.yellow}`,
        },
        '&:focus-visible': {
          outline: `2px solid ${morkBorgColors.yellow}`,
          outlineOffset: '2px',
        },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: morkBorgColors.white,
          minWidth: 0,
          flexGrow: 1,
          flexBasis: isFull ? '100%' : 'auto',
          overflow: isFull ? 'visible' : 'hidden',
          textOverflow: isFull ? 'clip' : 'ellipsis',
          whiteSpace: isFull ? 'normal' : 'nowrap',
          lineHeight: isFull ? 1.3 : 1.2,
          pr: isFull ? 0 : 0.25,
          wordBreak: isFull ? 'break-word' : 'normal',
        }}
      >
        {modifier.name}
      </Typography>

      {modifier.comment && (
        <Tooltip title={modifier.comment} placement="top">
          <ChatBubbleIcon
            sx={{
              fontSize: 14,
              color: morkBorgColors.yellow,
              cursor: 'help',
              flexShrink: 0,
            }}
          />
        </Tooltip>
      )}

      <Chip
        label={(modifier.statistic ?? 'agility').toUpperCase()}
        size="small"
        sx={{
          bgcolor: morkBorgColors.pink,
          color: morkBorgColors.black,
          height: { xs: 26, sm: 22 },
          fontSize: { xs: '0.68rem', sm: '0.6rem' },
          flexShrink: 0,
        }}
      />

      <Typography
        sx={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1rem',
          color: isNegative ? morkBorgColors.pink : morkBorgColors.yellow,
          flexShrink: 0,
          animation: pulse
            ? `${valuePulse} 180ms cubic-bezier(0.22, 1, 0.36, 1)`
            : 'none',
        }}
      >
        {(modifier.value ?? 0) > 0 ? '+' : ''}
        {modifier.value ?? 0}
      </Typography>

      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={removeLabel}
        sx={{
          width: { xs: 40, sm: 22 },
          height: { xs: 40, sm: 22 },
          bgcolor: morkBorgColors.pink,
          color: morkBorgColors.black,
          flexShrink: 0,
          ml: isFull ? 'auto' : 0.25,
          '&:hover': {
            bgcolor: morkBorgColors.yellow,
          },
        }}
      >
        <CloseIcon sx={{ fontSize: { xs: 18, sm: 14 } }} />
      </IconButton>
    </Box>
  );
}

function ComputedModifierTag({
  modifier,
  onOpen,
  isFull,
  reduceMotion,
}: {
  modifier: ComputedModifier;
  onOpen: (modifier: ComputedModifier) => void;
  isFull: boolean;
  reduceMotion?: boolean;
}) {
  const { t } = useTranslation();
  const isNegative = (modifier.value ?? 0) < 0;
  const originName =
    modifier.originName ?? t('modifiers.computed.unknownOrigin');
  const [pulse, setPulse] = useState(false);
  const previousValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const nextValue = modifier.value ?? 0;
    if (previousValueRef.current === null) {
      previousValueRef.current = nextValue;
      return;
    }
    if (previousValueRef.current !== nextValue) {
      setPulse(true);
      const timeoutId = window.setTimeout(() => setPulse(false), 180);
      previousValueRef.current = nextValue;
      return () => window.clearTimeout(timeoutId);
    }
    previousValueRef.current = nextValue;
  }, [modifier.value, reduceMotion]);

  return (
    <Box
      onClick={() => onOpen(modifier)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(modifier);
        }
      }}
      role="button"
      tabIndex={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: isFull ? 'wrap' : 'nowrap',
        columnGap: 0.7,
        rowGap: 0.55,
        bgcolor: morkBorgColors.darkGrey,
        border: `1px solid ${morkBorgColors.darkGrey}`,
        p: 0.95,
        minHeight: 52,
        height: '100%',
        opacity: 0.8,
        cursor: 'pointer',
        '&:hover': {
          opacity: 1,
          border: `1px solid ${morkBorgColors.yellow}`,
        },
        '&:focus-visible': {
          outline: `2px solid ${morkBorgColors.yellow}`,
          outlineOffset: '2px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.7,
          minWidth: 0,
          flexGrow: 1,
          flexBasis: isFull ? '100%' : 'auto',
        }}
      >
        <LockIcon sx={{ fontSize: 14, color: '#666' }} />
        <Typography
          variant="body2"
          sx={{
            color: '#999',
            minWidth: 0,
            overflow: isFull ? 'visible' : 'hidden',
            textOverflow: isFull ? 'clip' : 'ellipsis',
            whiteSpace: isFull ? 'normal' : 'nowrap',
            lineHeight: isFull ? 1.3 : 1.2,
            wordBreak: isFull ? 'break-word' : 'normal',
          }}
        >
          {originName}
        </Typography>
      </Box>
      <Chip
        label={(modifier.statistic ?? 'agility').toUpperCase()}
        size="small"
        sx={{
          bgcolor: morkBorgColors.pink,
          color: morkBorgColors.black,
          height: { xs: 24, sm: 20 },
          fontSize: { xs: '0.65rem', sm: '0.55rem' },
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '0.9rem',
          color: isNegative ? morkBorgColors.pink : morkBorgColors.yellow,
          flexShrink: 0,
          animation: pulse
            ? `${valuePulse} 180ms cubic-bezier(0.22, 1, 0.36, 1)`
            : 'none',
        }}
      >
        {(modifier.value ?? 0) > 0 ? '+' : ''}
        {modifier.value ?? 0}
      </Typography>
    </Box>
  );
}

export default function ModifiersPanel() {
  const { character, addModifier, removeModifier, updateModifier } =
    useCharacter();
  const { t } = useTranslation();
  const prefersReducedMotion = Boolean(useReducedMotion());
  const REMOVE_ANIMATION_MS = 220;
  const [modifierShiftLabel, setModifierShiftLabel] = useState<string | null>(
    null
  );
  const computedSignatureRef = useRef<string | null>(null);
  const shiftTimeoutRef = useRef<number | null>(null);

  // Quick form state
  const [name, setName] = useState('');
  const [stat, setStat] = useState<LocalStatistic>('agility');
  const [valueStr, setValueStr] = useState<string>('');
  const [scope, setScope] = useState<ScopeOption>('all');

  // Advanced modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalStat, setModalStat] = useState<LocalStatistic>('agility');
  const [modalValueStr, setModalValueStr] = useState<string>('');
  const [modalComment, setModalComment] = useState('');
  const [modalScope, setModalScope] = useState<ScopeOption>('all');
  const [modalIncludes, setModalIncludes] = useState<string[]>([]);
  const [editingModifierId, setEditingModifierId] = useState<string | null>(
    null
  );
  const [removingModifierIds, setRemovingModifierIds] = useState<string[]>([]);
  const removeTimeoutsRef = useRef<number[]>([]);
  const [computedModalOpen, setComputedModalOpen] = useState(false);
  const [selectedComputedModifier, setSelectedComputedModifier] =
    useState<ComputedModifier | null>(null);

  // Derived values
  const value = valueStr === '' ? 0 : Number(valueStr);
  const modalValue = modalValueStr === '' ? 0 : Number(modalValueStr);

  const customModifiers = character?.modifiers ?? [];
  const computedModifiers = character?.computedModifiers ?? [];
  const computedSignature = computedModifiers
    .map(
      (mod) =>
        `${mod.originKey ?? mod.originName ?? 'origin'}:${mod.statistic ?? 'stat'}:${mod.value ?? 0}:${(mod.exclude ?? []).join('.')}`
    )
    .join('|');
  const computedTotal = computedModifiers.reduce(
    (sum, mod) => sum + (mod.value ?? 0),
    0
  );

  useEffect(() => {
    if (computedSignatureRef.current === null) {
      computedSignatureRef.current = computedSignature;
      return;
    }

    if (computedSignatureRef.current === computedSignature) return;
    computedSignatureRef.current = computedSignature;

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
      900
    );
  }, [computedSignature, computedTotal, t]);

  useEffect(() => {
    return () => {
      removeTimeoutsRef.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
      removeTimeoutsRef.current = [];
      if (shiftTimeoutRef.current) {
        window.clearTimeout(shiftTimeoutRef.current);
        shiftTimeoutRef.current = null;
      }
    };
  }, []);

  // Transform include array to exclude array (inverse logic)
  const includesToExclude = (includes: string[]): string[] => {
    return ALL_CONTEXTS.filter((c) => !includes.includes(c));
  };
  const excludeToIncludes = (exclude: string[]): string[] => {
    return ALL_CONTEXTS.filter((c) => !exclude.includes(c));
  };
  const hasSameValues = (a: string[], b: string[]): boolean => {
    return a.length === b.length && a.every((v) => b.includes(v));
  };
  const resolveScopeFromIncludes = (includes: string[]): ScopeOption => {
    return (
      scopeIncludeOptions.find((option) =>
        hasSameValues(option.include, includes)
      )?.value ?? 'all'
    );
  };

  const handleQuickAdd = () => {
    if (!name.trim()) return;

    const scopeConfig = scopeIncludeOptions.find((s) => s.value === scope);
    const exclude = includesToExclude(scopeConfig?.include ?? []);
    const newModifier = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      name: name.trim(),
      value,
      source: 'Player',
      statistic: stat as CustomModifier['statistic'],
      exclude,
    } as CustomModifier;

    addModifier(newModifier);

    // Reset form
    setName('');
    setValueStr('');
    setStat('agility');
    setScope('all');
  };

  const handleQuickKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') handleQuickAdd();
  };

  const handleOpenModal = () => {
    setEditingModifierId(null);
    // Pre-fill from quick form if there's data
    setModalName(name.trim() || '');
    setModalStat(stat);
    setModalValueStr(valueStr);
    setModalComment('');
    const scopeConfig = scopeIncludeOptions.find((s) => s.value === scope);
    setModalScope(scope);
    setModalIncludes(scopeConfig?.include ?? []);
    setModalOpen(true);
  };

  const handleOpenEditModal = (modifier: CustomModifier) => {
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

  const closeAdvancedModal = () => {
    setModalOpen(false);
    setEditingModifierId(null);
  };

  const handleModalScopeChange = (newScope: ScopeOption) => {
    setModalScope(newScope);
    const scopeConfig = scopeIncludeOptions.find((s) => s.value === newScope);
    setModalIncludes(scopeConfig?.include ?? []);
  };

  const handleAdvancedSave = () => {
    if (!modalName.trim()) return;

    const exclude = includesToExclude(modalIncludes);
    const modifierPayload = {
      name: modalName.trim(),
      value: modalValue,
      source: 'Player',
      statistic: modalStat as CustomModifier['statistic'],
      exclude,
      comment: modalComment.trim() || undefined,
    } as CustomModifier;

    if (editingModifierId) {
      updateModifier(editingModifierId, modifierPayload);
    } else {
      addModifier({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        ...modifierPayload,
      } as CustomModifier);
    }

    closeAdvancedModal();
  };

  const handleRemoveModifier = (modifierId?: string) => {
    if (!modifierId || removingModifierIds.includes(modifierId)) return;

    setRemovingModifierIds((prev) => [...prev, modifierId]);

    const timeoutId = window.setTimeout(() => {
      removeModifier(modifierId);
      setRemovingModifierIds((prev) => prev.filter((id) => id !== modifierId));
      removeTimeoutsRef.current = removeTimeoutsRef.current.filter(
        (id) => id !== timeoutId
      );
    }, REMOVE_ANIMATION_MS);

    removeTimeoutsRef.current.push(timeoutId);
  };

  const handleOpenComputedModal = (modifier: ComputedModifier) => {
    setSelectedComputedModifier(modifier);
    setComputedModalOpen(true);
  };

  const handleCloseComputedModal = () => {
    setComputedModalOpen(false);
    setSelectedComputedModifier(null);
  };

  const computedOriginName =
    selectedComputedModifier?.originName ??
    t('modifiers.computed.unknownOrigin');
  const computedExcluded = new Set(selectedComputedModifier?.exclude ?? []);
  const computedAppliesToOptions = allIncludeOptions.filter(
    (opt) => !computedExcluded.has(opt.value)
  );
  const computedAppliesToText =
    computedAppliesToOptions.length === allIncludeOptions.length
      ? t('modifiers.scopes.all')
      : computedAppliesToOptions.length === 0
        ? t('modifiers.computed.none')
        : computedAppliesToOptions.map((opt) => t(opt.labelKey)).join(', ');
  const computedValue = selectedComputedModifier?.value ?? 0;
  const computedStatisticLabel = (
    selectedComputedModifier?.statistic ?? 'agility'
  ).toUpperCase();
  const computedEffectText = selectedComputedModifier?.source ?? '';
  const isEditingModal = editingModifierId !== null;
  const modalTextFieldLabelSx = {
    color: morkBorgColors.pink,
    '&.Mui-focused': {
      color: morkBorgColors.yellow,
    },
  };
  const modalTextFieldInputSx = {
    color: morkBorgColors.white,
  };
  const tileInitial = prefersReducedMotion
    ? false
    : { opacity: 0, y: 8, scale: 0.98 };
  const tileAnimate = { opacity: 1, y: 0, scale: 1 };
  const tileExit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 8, scale: 0.96 };
  const tileTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        layout: { type: 'spring', stiffness: 460, damping: 36, mass: 0.42 },
        opacity: { duration: 0.16, ease: 'easeOut' },
        scale: { duration: 0.16, ease: 'easeOut' },
        y: { type: 'spring', stiffness: 520, damping: 34, mass: 0.38 },
      };
  type BentoSize = 'short' | 'medium' | 'full';
  type BentoTileSpan = { col: 2 | 3 | 6; row: 1 | 2; full: boolean };
  const resolveBentoSize = (nameLength: number): BentoSize => {
    if (nameLength >= 34) return 'full';
    if (nameLength >= 17) return 'medium';
    return 'short';
  };
  const getBentoTileSpan = (nameLength: number): BentoTileSpan => {
    const size = resolveBentoSize(nameLength);
    if (size === 'full') {
      return { col: 6, row: 2, full: true };
    }
    if (size === 'medium') {
      return { col: 3, row: 1, full: false };
    }
    return { col: 2, row: 1, full: false };
  };

  return (
    <Box sx={{
      mb: 2,
      bgcolor: morkBorgColors.black,
      border: `3px solid ${morkBorgColors.black}`,
      boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
      p: { xs: 1.5, sm: 2.5 },
      pt: { xs: 3, sm: 3.5 },
      position: 'relative',
    }}>
      <Typography variant="h3" sx={{
        ...modifiersTitleStyle,
        position: 'absolute',
        top: { xs: -14, sm: -16 },
        left: { xs: 12, sm: 16 },
        zIndex: 1,
      }}>
        {t('modifiers.title')}
      </Typography>
      <Box
        sx={{
          position: 'relative',
        }}
      >
      {modifierShiftLabel && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            right: 12,
            px: 1.25,
            py: 0.35,
            bgcolor: morkBorgColors.yellow,
            color: morkBorgColors.black,
            border: `2px solid ${morkBorgColors.black}`,
            boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
            fontFamily: "'Antonio', sans-serif",
            fontSize: { xs: '0.7rem', sm: '0.6rem' },
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            animation: prefersReducedMotion
              ? 'none'
              : `${shiftBadge} 900ms cubic-bezier(0.22, 1, 0.36, 1)`,
            pointerEvents: 'none',
          }}
        >
          {modifierShiftLabel}
        </Box>
      )}
      {/* Computed Modifiers (Auto - from equipment) */}
      {computedModifiers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              color: morkBorgColors.yellow,
              opacity: 0.5,
              fontSize: { xs: '0.78rem', sm: '0.7rem' },
              mb: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: "'Antonio', sans-serif",
            }}
          >
            {t('modifiers.fromEquipment')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(6, minmax(0, 1fr))',
              },
              gridAutoRows: 'minmax(52px, auto)',
              gridAutoFlow: 'dense',
              gap: 1,
            }}
          >
            <AnimatePresence initial={false}>
              {computedModifiers.map((mod, idx) => {
                const nameLength = (mod.originName ?? '').trim().length;
                const tileSpan = getBentoTileSpan(nameLength);
                const computedKey =
                  mod.originKey ??
                  `${mod.originName ?? 'computed'}-${mod.statistic ?? 'agility'}-${mod.value ?? 0}-${idx}`;

                return (
                  <Box
                    key={computedKey}
                    component={motion.div}
                    layout={!prefersReducedMotion}
                    initial={tileInitial}
                    animate={tileAnimate}
                    exit={tileExit}
                    transition={tileTransition}
                    sx={{
                      minWidth: 0,
                      gridColumn: { xs: 'span 1', sm: `span ${tileSpan.col}` },
                      gridRow: { xs: 'span 1', sm: `span ${tileSpan.row}` },
                    }}
                  >
                    <ComputedModifierTag
                      modifier={mod}
                      onOpen={handleOpenComputedModal}
                      isFull={tileSpan.full}
                      reduceMotion={prefersReducedMotion}
                    />
                  </Box>
                );
              })}
            </AnimatePresence>
          </Box>
        </Box>
      )}

      {/* Custom Modifiers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(6, minmax(0, 1fr))' },
          gridAutoRows: 'minmax(56px, auto)',
          gridAutoFlow: 'dense',
          gap: 1,
          mb: 2,
          minHeight: 40,
        }}
      >
        {customModifiers.length === 0 ? (
          <Typography
            sx={{
              color: morkBorgColors.yellow,
              opacity: 0.4,
              fontStyle: 'italic',
              fontFamily: "'Alegreya', serif",
              fontSize: '0.8rem',
              gridColumn: '1 / -1',
            }}
          >
            {t('modifiers.noModifiers')}
          </Typography>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {customModifiers.map((mod, idx) => {
              const key = mod.id ?? `modifier-${idx}`;
              const isRemoving = mod.id
                ? removingModifierIds.includes(mod.id)
                : false;
              const nameLength = (mod.name ?? '').trim().length;
              const tileSpan = getBentoTileSpan(nameLength);

              if (isRemoving) return null;

              return (
                <Box
                  key={key}
                  component={motion.div}
                  layout={!prefersReducedMotion}
                  initial={tileInitial}
                  animate={tileAnimate}
                  exit={tileExit}
                  transition={tileTransition}
                  sx={{
                    minWidth: 0,
                    gridColumn: { xs: 'span 1', sm: `span ${tileSpan.col}` },
                    gridRow: { xs: 'span 1', sm: `span ${tileSpan.row}` },
                  }}
                >
                    <CustomModifierTag
                      modifier={mod}
                      onEdit={() => handleOpenEditModal(mod)}
                      onRemove={() => handleRemoveModifier(mod.id)}
                      isFull={tileSpan.full}
                      removeLabel={t('modifiers.removeModifier', 'Remove modifier')}
                      reduceMotion={prefersReducedMotion}
                    />
                  </Box>
                );
              })}
          </AnimatePresence>
        )}
      </Box>

      {/* Quick Form — control strip */}
      <Box
        className="print-hidden"
        sx={{
          mt: 2,
          pt: 2,
          borderTop: `2px solid ${morkBorgColors.grey}`,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr auto', sm: '1fr auto auto auto auto auto' },
          gap: { xs: 1, sm: 0.75 },
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder={t('modifiers.namePlaceholder')}
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          onKeyDown={handleQuickKeyDown}
          size="small"
          sx={{
            gridColumn: { xs: '1 / -1', sm: 'auto' },
            '& .MuiOutlinedInput-root': {
              fontFamily: "'Antonio', sans-serif",
              fontSize: { xs: '0.9rem', sm: '0.8rem' },
              letterSpacing: '0.05em',
            },
          }}
          inputProps={{
            "data-testid": "quick-mod-name-input",
            "aria-label": t('modifiers.name'),
          }}
        />

        <Select
          value={stat}
          onChange={(e) => setStat(e.target.value as LocalStatistic)}
          inputProps={{ 'aria-label': t('modifiers.statistic', 'Modifier statistic') }}
          size="small"
          sx={{
            bgcolor: morkBorgColors.grey,
            color: morkBorgColors.yellow,
            minWidth: 75,
            '& .MuiSelect-select': {
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: { xs: '0.95rem', sm: '0.85rem' },
              letterSpacing: '0.1em',
            },
          }}
        >
          {statOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        <TextField
          type="number"
          placeholder="+1"
          value={valueStr}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setValueStr(e.target.value)
          }
          onKeyDown={handleQuickKeyDown}
          size="small"
          sx={{
            width: { xs: '100%', sm: 60 },
            '& .MuiOutlinedInput-root': {
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: { xs: '1rem', sm: '0.9rem' },
              textAlign: 'center',
            },
          }}
          inputProps={{
            "data-testid": "quick-mod-value-input",
            "aria-label": t('modifiers.value'),
          }}
        />

        <Select
          value={scope}
          onChange={(e) => setScope(e.target.value as ScopeOption)}
          inputProps={{ 'aria-label': t('modifiers.scope') }}
          size="small"
          sx={{
            bgcolor: morkBorgColors.grey,
            color: morkBorgColors.yellow,
            minWidth: 90,
            '& .MuiSelect-select': {
              fontFamily: "'Antonio', sans-serif",
              fontSize: { xs: '0.72rem', sm: '0.6rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            },
          }}
        >
          {scopeIncludeOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </MenuItem>
          ))}
        </Select>

        <Button
          variant="contained"
          onClick={handleQuickAdd}
          data-testid="quick-mod-add-btn"
          sx={{
            gridColumn: { xs: '1 / 2', sm: 'auto' },
            minWidth: 'auto',
            minHeight: { xs: 44, sm: 36 },
            px: 2.5,
            bgcolor: morkBorgColors.yellow,
            color: morkBorgColors.black,
            fontFamily: "'Antonio', sans-serif",
            fontSize: { xs: '0.8rem', sm: '0.7rem' },
            fontWeight: 'bold',
            letterSpacing: '0.15em',
            boxShadow: `2px 2px 0 ${morkBorgColors.pink}`,
            '&:hover': {
              bgcolor: morkBorgColors.pink,
              color: morkBorgColors.black,
              transform: 'translate(-1px, -1px)',
              boxShadow: `3px 3px 0 ${morkBorgColors.yellow}`,
            },
          }}
        >
          {t('modifiers.addModifier')}
        </Button>

        <Tooltip title={t('modifiers.advancedTooltip')} placement="top">
          <IconButton
            onClick={handleOpenModal}
            aria-label={t('modifiers.advancedTooltip')}
            data-testid="advanced-mod-btn"
            sx={{
              gridColumn: { xs: '2 / 3', sm: 'auto' },
              justifySelf: 'end',
              width: { xs: 44, sm: 36 },
              height: { xs: 44, sm: 36 },
              borderRadius: 0,
              border: `2px solid ${morkBorgColors.yellow}`,
              bgcolor: 'transparent',
              color: morkBorgColors.yellow,
              fontFamily: "'Antonio', sans-serif",
              fontSize: { xs: '1.1rem', sm: '1rem' },
              lineHeight: 1,
              transition:
                'transform 140ms ease, box-shadow 140ms ease, color 140ms ease',
              '&:hover': {
                bgcolor: morkBorgColors.yellow,
                color: morkBorgColors.black,
                transform: 'translate(-1px, -1px)',
                boxShadow: `2px 2px 0 ${morkBorgColors.pink}`,
              },
            }}
          >
            ✠
          </IconButton>
        </Tooltip>
      </Box>

      {/* Advanced Modal */}
      <MorkBorgModal
        open={modalOpen}
        onClose={closeAdvancedModal}
        maxWidth="xs"
        title={
          isEditingModal
            ? t('modifiers.modal.editTitle')
            : t('modifiers.modal.title')
        }
        actions={
          <>
            <Button onClick={closeAdvancedModal}>{t('common.cancel')}</Button>
            <Button
              variant="contained"
              onClick={handleAdvancedSave}
              disabled={!modalName.trim()}
              data-testid="modal-mod-save-btn"
            >
              {isEditingModal
                ? t('modifiers.saveModifier')
                : t('modifiers.addModifier')}
            </Button>
          </>
        }
      >
        {/* Name */}
        <TextField
          label={t('modifiers.name')}
          value={modalName}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setModalName(e.target.value)
          }
          fullWidth
          autoFocus
          sx={{ mt: 0.5 }}
          InputLabelProps={{ sx: modalTextFieldLabelSx }}
          InputProps={{ sx: modalTextFieldInputSx }}
          inputProps={{ "data-testid": "modal-mod-name-input" }}
        />

        {/* Statistic */}
        <Select
          value={modalStat}
          onChange={(e) => setModalStat(e.target.value as LocalStatistic)}
          inputProps={{ 'aria-label': t('modifiers.statistic', 'Modifier statistic') }}
          fullWidth
          displayEmpty
          sx={{
            bgcolor: morkBorgColors.darkGrey,
            color: morkBorgColors.yellow,
            '& .MuiSelect-select': {
              fontFamily: "'Antonio', sans-serif",
              textTransform: 'uppercase',
            },
          }}
        >
          {statOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Value */}
        <TextField
          label={t('modifiers.value')}
          type="number"
          value={modalValueStr}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setModalValueStr(e.target.value)
          }
          fullWidth
          placeholder="+1"
          InputLabelProps={{ sx: modalTextFieldLabelSx }}
          InputProps={{ sx: modalTextFieldInputSx }}
        />

        {/* Scope (what it applies TO) */}
        <Select
          value={modalScope}
          onChange={(e) =>
            handleModalScopeChange(e.target.value as ScopeOption)
          }
          inputProps={{ 'aria-label': t('modifiers.scope') }}
          fullWidth
          displayEmpty
          sx={{
            bgcolor: morkBorgColors.darkGrey,
            color: morkBorgColors.yellow,
            '& .MuiSelect-select': {
              fontFamily: "'Antonio', sans-serif",
              textTransform: 'uppercase',
            },
          }}
        >
          {scopeIncludeOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </MenuItem>
          ))}
        </Select>

        {/* Include Checkboxes */}
        <Box>
          <Typography
            sx={{
              color: morkBorgColors.pink,
              fontSize: { xs: '0.82rem', sm: '0.75rem' },
              mb: 1,
            }}
          >
            {t('modifiers.exclude.title')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#999',
              mb: 1.5,
              fontSize: { xs: '0.8rem', sm: '0.7rem' },
            }}
          >
            {t('modifiers.exclude.description')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {allIncludeOptions.map((opt) => (
              <FormControlLabel
                key={opt.value}
                control={
                  <Checkbox
                    checked={modalIncludes.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setModalIncludes([...modalIncludes, opt.value]);
                      } else {
                        setModalIncludes(
                          modalIncludes.filter((x) => x !== opt.value)
                        );
                      }
                    }}
                    sx={{
                      color: morkBorgColors.yellow,
                      '&.Mui-checked': {
                        color: morkBorgColors.yellow,
                      },
                    }}
                  />
                }
                label={t(opt.labelKey)}
                sx={{
                  color: morkBorgColors.white,
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '0.9rem', sm: '0.8rem' },
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Comment */}
        <TextField
          label={t('modifiers.comment')}
          value={modalComment}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setModalComment(e.target.value)
          }
          fullWidth
          multiline
          rows={2}
          InputLabelProps={{ sx: modalTextFieldLabelSx }}
          InputProps={{ sx: modalTextFieldInputSx }}
        />
      </MorkBorgModal>

      <MorkBorgModal
        open={computedModalOpen}
        onClose={handleCloseComputedModal}
        maxWidth="xs"
        title={t('modifiers.computed.modal.title')}
        actions={
          <Button onClick={handleCloseComputedModal}>
            {t('common.close')}
          </Button>
        }
      >
        <Typography
          sx={{
            color: '#999',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {t('modifiers.computed.modal.source')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white }}>
          {t('modifiers.computed.from', { name: computedOriginName })}
        </Typography>

        <Typography
          sx={{
            color: '#999',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {t('modifiers.computed.modal.effect')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white }}>
          {computedEffectText}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip
            label={computedStatisticLabel}
            size="small"
            sx={{
              bgcolor: morkBorgColors.pink,
              color: morkBorgColors.black,
              height: { xs: 26, sm: 22 },
              fontSize: { xs: '0.68rem', sm: '0.6rem' },
            }}
          />
          <Typography
            sx={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1rem',
              color:
                computedValue < 0 ? morkBorgColors.pink : morkBorgColors.yellow,
            }}
          >
            {computedValue > 0 ? '+' : ''}
            {computedValue}
          </Typography>
        </Box>

        <Typography
          sx={{
            color: '#999',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            mt: 0.5,
          }}
        >
          {t('modifiers.computed.appliesTo')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white }}>
          {computedAppliesToText}
        </Typography>
      </MorkBorgModal>
    </Box>
    </Box>
  );
}
