import { type ComputedModifier, type CustomModifier, type Statistic } from '@/hooks/models';

export type LocalStatistic = Statistic;

export type IncludeContext = 'melee' | 'ranged' | 'defence' | 'cast' | 'ability';

export type ScopeOption =
  | 'all'
  | 'combat'
  | 'defence'
  | 'melee'
  | 'ranged'
  | 'powers';

export interface StatOption {
  value: LocalStatistic;
  label: string;
}

export interface IncludeOption {
  value: IncludeContext;
  labelKey: string;
}

export interface ScopeIncludeOption {
  value: ScopeOption;
  labelKey: string;
  include: IncludeContext[];
}

export interface ModifierTileSpan {
  col: 2 | 3 | 6;
  row: 1 | 2;
  full: boolean;
}

export interface ModifiersQuickFormState {
  name: string;
  stat: LocalStatistic;
  valueStr: string;
  scope: ScopeOption;
}

export interface ModifiersAdvancedFormState {
  open: boolean;
  isEditing: boolean;
  canSave: boolean;
  name: string;
  stat: LocalStatistic;
  valueStr: string;
  comment: string;
  scope: ScopeOption;
  includes: IncludeContext[];
}

export interface ModifiersComputedModalState {
  open: boolean;
  selectedModifier: ComputedModifier | null;
}

export interface ModifiersPanelState {
  prefersReducedMotion: boolean;
  modifierShiftLabel: string | null;
  quickForm: ModifiersQuickFormState;
  customModifiers: CustomModifier[];
  computedModifiers: ComputedModifier[];
  removingModifierIds: string[];
  advancedModal: ModifiersAdvancedFormState;
  computedModal: ModifiersComputedModalState;
}
