import { type IncludeContext, type IncludeOption, type ScopeIncludeOption, type StatOption } from '@components/modifiers/types';

export const statOptions: StatOption[] = [
  { value: 'agility', label: 'AGI' },
  { value: 'strength', label: 'STR' },
  { value: 'presence', label: 'PRE' },
  { value: 'toughness', label: 'TOU' },
];

export const allIncludeOptions: IncludeOption[] = [
  { value: 'melee', labelKey: 'modifiers.exclude.melee' },
  { value: 'ranged', labelKey: 'modifiers.exclude.ranged' },
  { value: 'defence', labelKey: 'modifiers.exclude.defence' },
  { value: 'cast', labelKey: 'modifiers.exclude.cast' },
  { value: 'ability', labelKey: 'modifiers.exclude.ability' },
];

export const ALL_CONTEXTS: IncludeContext[] = allIncludeOptions.map(
  (option) => option.value,
);

export const scopeIncludeOptions: ScopeIncludeOption[] = [
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
