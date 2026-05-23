import { useEffect, useMemo, useState } from 'react';
import {
  ARMOR_PRESETS,
  type ArmorPreset,
  buildCustomItemBundle,
  type CustomItemKind,
} from '@/inventory/customItems';
import {
  type Character,
  type EquipmentItem,
  type Statistic,
} from '@/hooks/models';
import { type ScopeOption } from '@components/modifiers/types';

export type CustomItemFormState = {
  kind: CustomItemKind;
  name: string;
  description: string;
  comments: string;
  value: string;
  quantity: string;
  damageDie: string;
  ammoType: string;
  ammoAmount: string;
  armorPreset: ArmorPreset;
  armorDie: string;
  armorTier: string;
  consumeMode: 'fixed' | 'fixedPlusModifier';
  consumeBase: string;
  consumeStatistic: Statistic;
  modifierEnabled: boolean;
  modifierValue: string;
  modifierStatistic: Statistic;
  modifierScope: ScopeOption;
};

const parseInteger = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
};

const initialFormState = (): CustomItemFormState => ({
  kind: 'misc',
  name: '',
  description: '',
  comments: '',
  value: '0',
  quantity: '1',
  damageDie: '4',
  ammoType: '',
  ammoAmount: '0',
  armorPreset: 'light',
  armorDie: String(ARMOR_PRESETS.light.die),
  armorTier: String(ARMOR_PRESETS.light.tier),
  consumeMode: 'fixed',
  consumeBase: '1',
  consumeStatistic: 'presence',
  modifierEnabled: false,
  modifierValue: '-1',
  modifierStatistic: 'agility',
  modifierScope: 'all',
});

type Stats = Pick<Character, 'agility' | 'strength' | 'presence' | 'toughness'>;

// Bounds shared between the form (helper text + canSave gate) and the
// build step (parseInteger fallback). Single source of truth so the
// helper-text hints can't drift from what the persistence layer accepts.
export const FIELD_BOUNDS = {
  value: { min: 0, max: 1_000_000 },
  quantity: { min: 1, max: 50 },
  damageDie: { min: 1, max: 20 },
  ammoAmount: { min: 0, max: 999 },
  armorDie: { min: 1, max: 20 },
  armorTier: { min: 0, max: 4 },
  consumeBase: { min: 0, max: 50 },
  modifierValue: { min: -20, max: 20 },
} as const;

export type FieldName = keyof typeof FIELD_BOUNDS;

export type UseCustomItemForm = {
  state: CustomItemFormState;
  update: <K extends keyof CustomItemFormState>(
    key: K,
    value: CustomItemFormState[K],
  ) => void;
  handleKindChange: (next: CustomItemKind) => void;
  handleArmorPresetChange: (preset: ArmorPreset) => void;
  canSave: boolean;
  showModifierPanel: boolean;
  showQuantity: boolean;
  buildBundle: () => EquipmentItem[];
  // Preview-shaped bundle that re-runs on every change. Empty until the
  // user names the item — that gate stays in the form so the preview
  // component doesn't have to know.
  previewItems: EquipmentItem[];
  // Per-field out-of-range flags. `true` means the current string fails
  // the bounds in FIELD_BOUNDS — used to colour helper text and block save.
  fieldErrors: Record<FieldName, boolean>;
};

export function useCustomItemForm(
  open: boolean,
  character: Character | null | undefined,
): UseCustomItemForm {
  const [state, setState] = useState<CustomItemFormState>(initialFormState);

  useEffect(() => {
    if (open) setState(initialFormState());
  }, [open]);

  const update = <K extends keyof CustomItemFormState>(
    key: K,
    value: CustomItemFormState[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));

  const handleKindChange = (next: CustomItemKind) => {
    // Carry over fields that describe the item-as-noun (identity, story,
    // worth) but reset everything kind-specific (dice, tiers, modifier).
    // The carryover is intentional: a player typing "Bone-handled dagger"
    // who realises it's actually armor should not lose their name. Fields
    // not preserved here are by-design transient to the kind they belong to.
    setState((prev) => ({
      ...initialFormState(),
      name: prev.name,
      description: prev.description,
      comments: prev.comments,
      value: prev.value,
      kind: next,
      ammoAmount: next === 'ammo' ? '1' : '0',
    }));
  };

  const handleArmorPresetChange = (preset: ArmorPreset) => {
    const config = ARMOR_PRESETS[preset];
    setState((prev) => ({
      ...prev,
      armorPreset: preset,
      armorDie: String(config.die),
      armorTier: String(config.tier),
    }));
  };

  const stats: Stats = useMemo(
    () => ({
      agility: character?.agility,
      strength: character?.strength,
      presence: character?.presence,
      toughness: character?.toughness,
    }),
    [
      character?.agility,
      character?.presence,
      character?.strength,
      character?.toughness,
    ],
  );

  const showModifierPanel = state.kind === 'weapon' || state.kind === 'armor';
  const showQuantity = state.kind === 'misc' || state.kind === 'consumable';

  // A field is "active" only when its panel is rendered. Off-screen fields
  // shouldn't block save just because their default placeholder happens to
  // be outside their (currently irrelevant) bounds.
  const activeFields: ReadonlyArray<FieldName> = (() => {
    const fields: FieldName[] = ['value'];
    if (showQuantity) fields.push('quantity');
    if (state.kind === 'weapon') {
      fields.push('damageDie');
      if (state.ammoType.trim()) fields.push('ammoAmount');
    }
    if (state.kind === 'ammo') fields.push('ammoAmount');
    if (state.kind === 'armor') fields.push('armorDie', 'armorTier');
    if (state.kind === 'consumable') fields.push('consumeBase');
    if (showModifierPanel && state.modifierEnabled) {
      fields.push('modifierValue');
    }
    return fields;
  })();

  const isOutOfRange = (raw: string, field: FieldName): boolean => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return true;
    const { min, max } = FIELD_BOUNDS[field];
    return n < min || n > max;
  };

  const fieldErrors = (Object.keys(FIELD_BOUNDS) as FieldName[]).reduce(
    (acc, field) => {
      const raw = state[field as keyof CustomItemFormState] as string;
      acc[field] = activeFields.includes(field) && isOutOfRange(raw, field);
      return acc;
    },
    {} as Record<FieldName, boolean>,
  );

  const hasFieldErrors = activeFields.some((field) => fieldErrors[field]);
  const canSave = state.name.trim().length > 0 && !hasFieldErrors;

  const buildBundle = (): EquipmentItem[] => {
    if (!canSave) return [];

    return buildCustomItemBundle(
      {
        kind: state.kind,
        name: state.name,
        description: state.description,
        comments: state.comments,
        value: parseInteger(state.value, 0),
        quantity: parseInteger(state.quantity, 1),
        damageDie: parseInteger(state.damageDie, 4),
        ammoType: state.ammoType,
        ammoAmount: parseInteger(state.ammoAmount, 0),
        armorPreset: state.armorPreset,
        armorDie: parseInteger(
          state.armorDie,
          ARMOR_PRESETS[state.armorPreset].die,
        ),
        armorTier: parseInteger(
          state.armorTier,
          ARMOR_PRESETS[state.armorPreset].tier,
        ),
        useCountRule:
          state.kind === 'consumable'
            ? {
                mode: state.consumeMode,
                base: parseInteger(state.consumeBase, 1),
                statistic: state.consumeStatistic,
              }
            : undefined,
        modifier: showModifierPanel
          ? {
              enabled: state.modifierEnabled,
              value: parseInteger(state.modifierValue, -1),
              statistic: state.modifierStatistic,
              scope: state.modifierScope,
            }
          : undefined,
      },
      stats,
    );
  };

  // Preview is generated from a relaxed build: even when canSave is false
  // (e.g. empty name), we still want to show the shape as the user picks a
  // kind. We synthesize a placeholder name so the bundle returns something.
  const previewItems: EquipmentItem[] = buildCustomItemBundle(
    {
      kind: state.kind,
      name: state.name.trim() || ' ',
      description: state.description,
      comments: state.comments,
      value: Number(state.value) || 0,
      quantity: Number(state.quantity) || 1,
      damageDie: Number(state.damageDie) || 4,
      ammoType: state.ammoType,
      ammoAmount: Number(state.ammoAmount) || 0,
      armorPreset: state.armorPreset,
      armorDie: Number(state.armorDie) || ARMOR_PRESETS[state.armorPreset].die,
      armorTier:
        Number(state.armorTier) || ARMOR_PRESETS[state.armorPreset].tier,
      useCountRule:
        state.kind === 'consumable'
          ? {
              mode: state.consumeMode,
              base: Number(state.consumeBase) || 1,
              statistic: state.consumeStatistic,
            }
          : undefined,
      modifier: showModifierPanel
        ? {
            enabled: state.modifierEnabled,
            value: Number(state.modifierValue) || -1,
            statistic: state.modifierStatistic,
            scope: state.modifierScope,
          }
        : undefined,
    },
    stats,
  );

  return {
    state,
    update,
    handleKindChange,
    handleArmorPresetChange,
    canSave,
    showModifierPanel,
    showQuantity,
    buildBundle,
    previewItems,
    fieldErrors,
  };
}
