import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useOnHandSection } from '../../../src/hooks/useOnHandSection.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('useOnHandSection adjusts quantities and delegates update/delete/move actions', () => {
  const addEquipmentItem = vi.fn();
  const removeEquipmentItem = vi.fn();
  const updateEquipmentItem = vi.fn();
  const moveToStorage = vi.fn();

  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        { key: 'torch', name: 'Torch' },
        { key: 'torch', name: 'Torch' },
        { key: 'rope', name: 'Rope' },
      ],
    },
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
    moveToStorage,
  });

  const { result } = renderHook(() => useOnHandSection(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.aggregated.length).toBe(2);

  act(() => {
    result.current.handleAdjustQuantity({ key: 'rations', name: 'Rations' }, 3, [0]);
  });
  expect(addEquipmentItem).toHaveBeenCalledTimes(2);

  act(() => {
    result.current.handleAdjustQuantity({ key: 'torch', name: 'Torch' }, 1, [0, 1, 2]);
  });
  expect(removeEquipmentItem).toHaveBeenNthCalledWith(1, 2);
  expect(removeEquipmentItem).toHaveBeenNthCalledWith(2, 1);

  act(() => {
    result.current.handleUpdate([0, 2], { key: 'hat', name: 'Hat' });
    result.current.handleDelete([0, 3]);
    result.current.handleMove([1, 4]);
  });

  expect(updateEquipmentItem).toHaveBeenNthCalledWith(1, 0, { key: 'hat', name: 'Hat' });
  expect(updateEquipmentItem).toHaveBeenNthCalledWith(2, 2, { key: 'hat', name: 'Hat' });
  expect(removeEquipmentItem).toHaveBeenCalledWith(3);
  expect(removeEquipmentItem).toHaveBeenCalledWith(0);
  expect(moveToStorage).toHaveBeenNthCalledWith(1, 4);
  expect(moveToStorage).toHaveBeenNthCalledWith(2, 1);
});

test('useOnHandSection loads full item payload and transforms pet-specific fields', async () => {
  const addEquipmentItem = vi.fn();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      key: 'pet.wolf',
      tags: ['pet'],
      action_die: [6, 'x', 8],
      hp: 3,
    }),
  });

  const wrapperState = createCharacterTestWrapper({
    character: { equipment: [] },
    addEquipmentItem,
  });

  const { result } = renderHook(() => useOnHandSection(), {
    wrapper: wrapperState.wrapper,
  });

  await act(async () => {
    await result.current.handleAddItem({
      itemType: 'pet',
      id: 7,
      key: 'pet.wolf',
      name: 'Wolf Pup',
      tags: [],
    });
  });

  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3000/api/equipment/pet/7?key=pet.wolf',
  );
  expect(addEquipmentItem).toHaveBeenCalledWith(
    expect.objectContaining({
      key: 'pet.wolf',
      name: 'Wolf Pup',
      dice: [6, 8],
      uses: [true, true, true],
    }),
  );
  expect(result.current.loadingItems).toEqual([]);
});

test('useOnHandSection skips add when full item fetch fails', async () => {
  const addEquipmentItem = vi.fn();
  fetchMock.mockResolvedValue({
    ok: false,
  });

  const wrapperState = createCharacterTestWrapper({
    character: { equipment: [] },
    addEquipmentItem,
  });

  const { result } = renderHook(() => useOnHandSection(), {
    wrapper: wrapperState.wrapper,
  });

  await act(async () => {
    await result.current.handleAddItem({
      itemType: 'equipment',
      id: 12,
      key: 'gear.rope',
      name: 'Rope',
      tags: [],
    });
  });

  expect(addEquipmentItem).not.toHaveBeenCalled();
  expect(result.current.loadingItems).toEqual([]);
});

test('useOnHandSection tolerates malformed item payloads and falls back to hit data', async () => {
  const addEquipmentItem = vi.fn();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => null,
  });

  const wrapperState = createCharacterTestWrapper({
    character: { equipment: [] },
    addEquipmentItem,
  });

  const { result } = renderHook(() => useOnHandSection(), {
    wrapper: wrapperState.wrapper,
  });

  await act(async () => {
    await result.current.handleAddItem({
      itemType: 'equipment',
      id: 3,
      key: 'gear.hook',
      name: 'Hook',
      tags: [],
    });
  });

  expect(addEquipmentItem).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Hook',
      uses: [],
    }),
  );
  expect(result.current.loadingItems).toEqual([]);
});

test('useOnHandSection expands ammo stacks from default amount', async () => {
  const addEquipmentItem = vi.fn();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      key: 'ammo.arrows',
      name: 'Arrows',
      tags: ['ammo'],
      default_amount: 3,
    }),
  });

  const wrapperState = createCharacterTestWrapper({
    character: { equipment: [] },
    addEquipmentItem,
  });

  const { result } = renderHook(() => useOnHandSection(), {
    wrapper: wrapperState.wrapper,
  });

  await act(async () => {
    await result.current.handleAddItem({
      itemType: 'equipment',
      id: 9,
      key: 'ammo.arrows',
      name: 'Arrows',
      tags: ['ammo'],
    });
  });

  expect(addEquipmentItem).toHaveBeenCalledTimes(3);
  expect(addEquipmentItem).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      key: 'ammo.arrows',
      name: 'Arrows',
    }),
  );
});

test('useOnHandSection clears loading state when item fetch throws', async () => {
  const addEquipmentItem = vi.fn();
  fetchMock.mockRejectedValue(new Error('network down'));

  const wrapperState = createCharacterTestWrapper({
    character: { equipment: [] },
    addEquipmentItem,
  });

  const { result } = renderHook(() => useOnHandSection(), {
    wrapper: wrapperState.wrapper,
  });

  await act(async () => {
    await result.current.handleAddItem({
      itemType: 'equipment',
      id: 12,
      key: 'gear.rope',
      name: 'Rope',
      tags: [],
    });
  });

  expect(addEquipmentItem).not.toHaveBeenCalled();
  expect(result.current.loadingItems).toEqual([]);
});
