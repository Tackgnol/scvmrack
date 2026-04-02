import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useModifiersPanel } from '../../../src/hooks/useModifiersPanel.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

test('useModifiersPanel manages quick add form and actions', () => {
  const addModifier = vi.fn();
  const wrapperState = createCharacterTestWrapper({
    character: { modifiers: [] } as any,
    addModifier,
  });

  const { result } = renderHook(() => useModifiersPanel(), {
    wrapper: wrapperState.wrapper,
  });

  // Initial state
  expect(result.current.state.quickForm.name).toBe('');

  // Update quick form
  act(() => {
    result.current.actions.setName('Test Mod');
    result.current.actions.setValueStr('2');
    result.current.actions.setStat('strength');
  });

  expect(result.current.state.quickForm.name).toBe('Test Mod');
  expect(result.current.state.quickForm.valueStr).toBe('2');

  // Quick Add
  act(() => {
    result.current.actions.handleQuickAdd();
  });

  expect(addModifier).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Test Mod',
    value: 2,
    statistic: 'strength'
  }));
  expect(result.current.state.quickForm.name).toBe(''); // Reset after add
});

test('useModifiersPanel manages advanced modal for add and edit', () => {
  const addModifier = vi.fn();
  const updateModifier = vi.fn();
  const wrapperState = createCharacterTestWrapper({
    character: {
      modifiers: [{ id: 'm1', name: 'Existing', value: 1, statistic: 'agility' }]
    } as any,
    addModifier,
    updateModifier,
  });

  const { result } = renderHook(() => useModifiersPanel(), {
    wrapper: wrapperState.wrapper,
  });

  // Open for new
  act(() => {
    result.current.actions.setName('New');
  });
  act(() => {
    result.current.actions.openAdvancedModal();
  });
  expect(result.current.state.advancedModal.open).toBe(true);
  expect(result.current.state.advancedModal.name).toBe('New');

  act(() => {
    result.current.actions.setModalName('New Final');
  });
  act(() => {
    result.current.actions.saveAdvancedModifier();
  });
  expect(addModifier).toHaveBeenCalled();
  expect(result.current.state.advancedModal.open).toBe(false);

  // Open for edit
  act(() => {
    result.current.actions.openEditModifierModal(wrapperState.getContext().character?.modifiers?.[0] as any);
  });
  expect(result.current.state.advancedModal.isEditing).toBe(true);
  expect(result.current.state.advancedModal.name).toBe('Existing');

  act(() => {
    result.current.actions.setModalName('Updated');
  });
  act(() => {
    result.current.actions.saveAdvancedModifier();
  });
  expect(updateModifier).toHaveBeenCalledWith('m1', expect.objectContaining({ name: 'Updated' }));
});

test('useModifiersPanel handles removal with animation delay', async () => {
  vi.useFakeTimers();
  const removeModifier = vi.fn();
  const wrapperState = createCharacterTestWrapper({
    character: { modifiers: [{ id: 'm1' }] } as any,
    removeModifier,
  });

  const { result } = renderHook(() => useModifiersPanel(), {
    wrapper: wrapperState.wrapper,
  });

  act(() => {
    result.current.actions.removeCustomModifier('m1');
  });

  expect(result.current.state.removingModifierIds).toContain('m1');
  expect(removeModifier).not.toHaveBeenCalled();

  act(() => {
    vi.advanceTimersByTime(300);
  });

  expect(removeModifier).toHaveBeenCalledWith('m1');
  expect(result.current.state.removingModifierIds).not.toContain('m1');
  
  vi.useRealTimers();
});

test('useModifiersPanel shows shift badge when computed modifiers change', () => {
  vi.useFakeTimers();
  const wrapperState = createCharacterTestWrapper({
    character: { computedModifiers: [] } as any,
  });

  const { result, rerender } = renderHook(() => useModifiersPanel(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.state.modifierShiftLabel).toBeNull();

  // Change computed modifiers
  wrapperState.setContext({
    character: {
        computedModifiers: [{ originName: 'O', statistic: 'agility', value: 1 }]
    } as any
  });
  rerender();

  expect(result.current.state.modifierShiftLabel).toBe('Blessings shift');

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.state.modifierShiftLabel).toBeNull();
  vi.useRealTimers();
});

test('useModifiersPanel handles modal scope changes and computed modifier details', () => {
  const wrapperState = createCharacterTestWrapper({
    character: {
        computedModifiers: [{ originKey: 'c1', value: 5, statistic: 'agility' }]
    } as any,
  });

  const { result } = renderHook(() => useModifiersPanel(), {
    wrapper: wrapperState.wrapper,
  });

  act(() => {
    result.current.actions.openAdvancedModal();
  });

  expect(result.current.state.advancedModal.scope).toBe('all');
  expect(result.current.state.advancedModal.includes).toEqual(['melee', 'ranged', 'defence', 'cast', 'ability']);

  act(() => {
    result.current.actions.handleModalScopeChange('defence');
  });
  expect(result.current.state.advancedModal.scope).toBe('defence');
  expect(result.current.state.advancedModal.includes).toEqual(['defence']);

  act(() => {
    result.current.actions.toggleModalInclude('melee', true);
  });
  expect(result.current.state.advancedModal.includes).toEqual(['defence', 'melee']);

  // Computed modal
  act(() => {
    result.current.actions.openComputedModifierModal(result.current.state.computedModifiers[0]);
  });
  expect(result.current.state.computedModal.open).toBe(true);
  expect(result.current.state.computedModal.selectedModifier?.value).toBe(5);

  act(() => {
    result.current.actions.closeComputedModifierModal();
  });
  expect(result.current.state.computedModal.open).toBe(false);
});
