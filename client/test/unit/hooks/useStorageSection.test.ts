import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useStorageSection } from '../../../src/hooks/useStorageSection.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

test('useStorageSection adjusts quantities and delegates update/delete/move actions', () => {
  const addStorageItem = vi.fn();
  const removeStorageItem = vi.fn();
  const updateStorageItem = vi.fn();
  const moveToEquipment = vi.fn();

  const wrapperState = createCharacterTestWrapper({
    character: {
      storage: [
        { key: 'arrow', name: 'Arrow' },
        { key: 'arrow', name: 'Arrow' },
        { key: 'salt', name: 'Salt' },
      ],
    },
    addStorageItem,
    removeStorageItem,
    updateStorageItem,
    moveToEquipment,
  });

  const { result } = renderHook(() => useStorageSection(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.aggregated.length).toBe(2);

  act(() => {
    result.current.handleAdjustQuantity({ key: 'coin', name: 'Coin' }, 3, [0]);
  });
  expect(addStorageItem).toHaveBeenCalledTimes(2);

  act(() => {
    result.current.handleAdjustQuantity({ key: 'arrow', name: 'Arrow' }, 1, [0, 1, 2]);
  });
  expect(removeStorageItem).toHaveBeenNthCalledWith(1, 2);
  expect(removeStorageItem).toHaveBeenNthCalledWith(2, 1);

  act(() => {
    result.current.handleUpdate([0, 2], { key: 'idol', name: 'Idol' });
    result.current.handleDelete([1, 4]);
    result.current.handleMove([0, 3]);
  });

  expect(updateStorageItem).toHaveBeenNthCalledWith(1, 0, { key: 'idol', name: 'Idol' });
  expect(updateStorageItem).toHaveBeenNthCalledWith(2, 2, { key: 'idol', name: 'Idol' });
  expect(removeStorageItem).toHaveBeenCalledWith(4);
  expect(removeStorageItem).toHaveBeenCalledWith(1);
  expect(moveToEquipment).toHaveBeenNthCalledWith(1, 3);
  expect(moveToEquipment).toHaveBeenNthCalledWith(2, 0);
});
