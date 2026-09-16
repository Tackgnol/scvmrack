import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useAbilityCard } from '../../../src/hooks/useAbilityCard.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: Record<string, unknown>) => {
      if (typeof fallback === 'string') {
        return fallback.replace('{{stat}}', String(options?.stat ?? ''));
      }
      return key;
    },
  }),
}));

test('useAbilityCard returns ability metadata and updates values with clamping', () => {
  const updateFieldCalls: Array<[string, number | string]> = [];
  const wrapperState = createCharacterTestWrapper({
    character: {
      id: 'char-44',
      strength: 15,
    },
    updateField: (field, value) => {
      updateFieldCalls.push([field, value]);
    },
  });

  const { result } = renderHook(() => useAbilityCard('strength'), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.value).toBe(15);
  expect(result.current.modifier).toBe(2);
  expect(result.current.characterKey).toBe('char-44');
  expect(result.current.label).toBe('attributes.strength');
  expect(result.current.description).toBe('attributes.strengthDesc');

  act(() => {
    result.current.adjustAbility(10);
  });
  act(() => {
    result.current.adjustAbility(-20);
  });
  act(() => {
    result.current.setAbilityFromInput('');
  });
  act(() => {
    result.current.setAbilityFromInput('0');
  });

  expect(updateFieldCalls).toEqual([
    ['strength', 21],
    ['strength', 1],
    ['strength', 10],
    ['strength', 1],
  ]);
});

test('useAbilityCard uses defaults when character is unavailable', () => {
  const wrapperState = createCharacterTestWrapper({
    character: undefined,
    updateField: () => {},
  });

  const { result } = renderHook(() => useAbilityCard('agility'), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.value).toBe(10);
  expect(result.current.characterKey).toBe('unknown');
});
