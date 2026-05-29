import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

const muiMocks = vi.hoisted(() => ({
  useMediaQuery: vi.fn(),
}));

vi.mock('@mui/material', () => ({
  useMediaQuery: muiMocks.useMediaQuery,
}));

import { useEquippedBar } from '../../../src/hooks/useEquippedBar.ts';

beforeEach(() => {
  muiMocks.useMediaQuery.mockReset();
  muiMocks.useMediaQuery.mockReturnValue(false);
});

test('useEquippedBar builds grouped inventory options and open-state flags', () => {
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        { key: 'weapon.sword', name: 'Sword', tags: ['weapon'] },
        { key: 'weapon.sword', name: 'Sword', tags: ['weapon'] },
        { key: 'armor.mail', name: 'Mail', tags: ['armor'] },
      ],
      equippedWeapons: [{ key: 'weapon.dagger', name: 'Dagger' }, null],
      equippedArmor: null,
    },
  });

  const { result } = renderHook(() => useEquippedBar(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.inventoryWeapons).toHaveLength(1);
  expect(result.current.inventoryWeapons[0].quantity).toBe(2);
  expect(result.current.inventoryArmor).toHaveLength(1);
  expect(result.current.mainWeapon?.key).toBe('weapon.dagger');
  expect(result.current.canOpenWeaponSlot0).toBe(true);
  expect(result.current.canOpenWeaponSlot1).toBe(true);
  expect(result.current.canOpenArmor).toBe(true);
});

test('useEquippedBar delegates equip/unequip flows with active slot tracking', () => {
  const equipWeapon = vi.fn();
  const unequipWeapon = vi.fn();
  const equipArmor = vi.fn();
  const unequipArmor = vi.fn();
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        { key: 'weapon.club', name: 'Club', tags: ['weapon'] },
        { key: 'armor.rags', name: 'Rags', tags: ['armor'] },
      ],
      equippedWeapons: [null, null],
      equippedArmor: { key: 'armor.old', name: 'Old Armor' },
    },
    equipWeapon,
    unequipWeapon,
    equipArmor,
    unequipArmor,
  });

  const { result } = renderHook(() => useEquippedBar(), {
    wrapper: wrapperState.wrapper,
  });

  const weaponAnchor = document.createElement('button');

  act(() => {
    result.current.openWeaponMenu({ currentTarget: weaponAnchor } as never, 1);
  });
  expect(result.current.activeWeaponSlot).toBe(1);
  expect(result.current.weaponAnchor).toBe(weaponAnchor);

  act(() => {
    result.current.selectWeapon(0);
  });
  expect(equipWeapon).toHaveBeenCalledWith(0, 1);
  expect(result.current.weaponAnchor).toBe(null);

  act(() => {
    result.current.openWeaponMenu({ currentTarget: weaponAnchor } as never, 0);
    result.current.unequipActiveWeapon();
  });
  expect(unequipWeapon).toHaveBeenCalledWith(1);

  act(() => {
    result.current.setArmorAnchor(document.createElement('button'));
    result.current.selectArmor(1);
  });
  expect(equipArmor).toHaveBeenCalledWith(1);
  expect(result.current.armorAnchor).toBe(null);

  act(() => {
    result.current.setArmorAnchor(document.createElement('button'));
    result.current.unequipCurrentArmor();
  });
  expect(unequipArmor).toHaveBeenCalledTimes(1);
  expect(result.current.armorAnchor).toBe(null);
});

test('useEquippedBar resolves ammo from both stacked and duplicate inventory items', () => {
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'], amount: 4 },
        { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'] },
        { key: 'equipment.bolts', name: 'Bolts', ammoType: 'Bolt', tags: ['ammo'], amount: 2 },
      ],
      equippedWeapons: [{ key: 'weapons.bow', name: 'Bow', ammoType: 'Arrow' }, null],
      equippedArmor: null,
    },
  });

  const { result } = renderHook(() => useEquippedBar(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.resolveAmmo('Arrow')).toBe(5);
  expect(result.current.resolveAmmo('Bolt')).toBe(2);
  expect(result.current.mainWeaponAmmo.ammoCount).toBe(5);
});

test('useEquippedBar consumes ammo only for equipped weapons with available ammo', () => {
  const consumeAmmo = vi.fn();
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        {
          key: 'equipment.arrows',
          name: 'Arrows',
          ammoType: 'Arrow',
          tags: ['ammo'],
          amount: 2,
        },
      ],
      equippedWeapons: [
        { key: 'weapons.bow', name: 'Bow', ammoType: 'Arrow' },
        { key: 'weapons.crossbow', name: 'Crossbow', ammoType: 'Bolt' },
      ],
      equippedArmor: null,
    },
    consumeAmmo,
  });

  const { result } = renderHook(() => useEquippedBar(), {
    wrapper: wrapperState.wrapper,
  });

  act(() => {
    result.current.useMainWeaponAmmo();
    result.current.useOffhandWeaponAmmo();
  });

  expect(consumeAmmo).toHaveBeenCalledTimes(1);
  expect(consumeAmmo).toHaveBeenCalledWith(0);
});
