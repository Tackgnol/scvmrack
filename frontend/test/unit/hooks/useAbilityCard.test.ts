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

for (const { name, edit, expected } of [
  { name: 'increase', edit: (card: ReturnType<typeof useAbilityCard>) => card.adjustAbility(1), expected: 21 },
  { name: 'decrease', edit: (card: ReturnType<typeof useAbilityCard>) => card.adjustAbility(-1), expected: 21 },
  { name: 'type 25', edit: (card: ReturnType<typeof useAbilityCard>) => card.setAbilityFromInput('25'), expected: 21 },
  { name: 'type 15', edit: (card: ReturnType<typeof useAbilityCard>) => card.setAbilityFromInput('15'), expected: 15 },
]) {
  test(`legacy score edit ${name} waits for confirmation and supports cancel`, () => {
    const updateField = vi.fn();
    const state = createCharacterTestWrapper({ character: { id: 'legacy', strength: 25 }, updateField });
    const { result } = renderHook(() => useAbilityCard('strength'), { wrapper: state.wrapper });
    const attempt = () => edit(result.current);
    act(attempt);
    expect(updateField).not.toHaveBeenCalled();
    expect(result.current.value).toBe(25);
    expect(result.current.pendingValue).toBe(expected);
    act(() => result.current.cancelAbilityChange());
    expect(result.current.pendingValue).toBeNull();
    expect(updateField).not.toHaveBeenCalled();
    act(attempt);
    act(() => result.current.confirmAbilityChange());
    expect(updateField).toHaveBeenCalledExactlyOnceWith('strength', expected);
  });
}

test('a pending legacy change cannot be applied to a different character', () => {
  const updateField = vi.fn();
  const state = createCharacterTestWrapper({ character: { id: 'legacy', strength: 25 }, updateField });
  const { result, rerender } = renderHook(() => useAbilityCard('strength'), { wrapper: state.wrapper });
  act(() => result.current.adjustAbility(-1));
  state.setContext({ character: { id: 'another', strength: 25 } });
  rerender();
  expect(result.current.pendingValue).toBeNull();
  act(() => result.current.confirmAbilityChange());
  expect(updateField).not.toHaveBeenCalled();
});
