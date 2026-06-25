import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useCharacterDescriptors } from '../../../src/hooks/useCharacterDescriptors.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

test('useCharacterDescriptors updates ability comments and descriptor fields', () => {
  const updateAbilitiesCalls: unknown[] = [];
  const updateFieldCalls: Array<[string, number | string]> = [];
  const wrapperState = createCharacterTestWrapper({
    character: {
      classId: 6,
      abilities: [{ name: 'Night Vision', comment: 'old note' }],
    },
    updateAbilities: (abilities: unknown) => {
      updateAbilitiesCalls.push(abilities);
    },
    updateField: (field, value) => {
      updateFieldCalls.push([field, value]);
    },
  });

  const { result } = renderHook(() => useCharacterDescriptors(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.isOccultHerbmaster).toBe(true);
  expect(result.current.abilities).toHaveLength(1);

  act(() => {
    result.current.updateAbilityComment(
      0,
      { name: 'Night Vision', comment: 'old note' },
      'new note',
    );
  });

  expect(updateAbilitiesCalls).toHaveLength(1);
  expect(updateAbilitiesCalls[0]).toEqual([{ name: 'Night Vision', comment: 'new note' }]);

  act(() => {
    result.current.updateDescriptorField('origin', 'Born in the ash fields');
  });

  expect(updateFieldCalls).toEqual([['origin', 'Born in the ash fields']]);
});

test('useCharacterDescriptors skips ability update when abilities are missing', () => {
  const updateAbilitiesCalls: unknown[] = [];
  const wrapperState = createCharacterTestWrapper({
    character: {
      classId: 1,
    },
    updateAbilities: (abilities: unknown) => {
      updateAbilitiesCalls.push(abilities);
    },
  });

  const { result } = renderHook(() => useCharacterDescriptors(), {
    wrapper: wrapperState.wrapper,
  });

  act(() => {
    result.current.updateAbilityComment(0, { name: 'Ghost Step' }, 'note');
  });

  expect(result.current.isOccultHerbmaster).toBe(false);
  expect(result.current.abilities).toEqual([]);
  expect(updateAbilitiesCalls).toHaveLength(0);
});
