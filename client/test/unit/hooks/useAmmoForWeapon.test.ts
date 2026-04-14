import { renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';
import { useAmmoForWeapon } from '../../../src/hooks/useAmmoForWeapon.ts';

test('returns null values for melee weapon (no ammoType)', () => {
    const wrapperState = createCharacterTestWrapper({
        character: {
            equipment: [],
        },
    });

    const { result } = renderHook(
        () => useAmmoForWeapon({ key: 'weapons.sword', name: 'Sword', tags: ['weapon', 'melee'] }),
        { wrapper: wrapperState.wrapper },
    );

    expect(result.current.ammoCount).toBeNull();
    expect(result.current.ammoType).toBeNull();
    expect(result.current.equipmentIndex).toBeNull();
});

test('returns null values for Infinite ammo type', () => {
    const wrapperState = createCharacterTestWrapper({
        character: {
            equipment: [],
        },
    });

    const { result } = renderHook(
        () => useAmmoForWeapon({ key: 'weapons.sling', name: 'Sling', ammoType: 'Infinite', tags: ['weapon', 'ranged'] }),
        { wrapper: wrapperState.wrapper },
    );

    expect(result.current.ammoCount).toBeNull();
    expect(result.current.ammoType).toBeNull();
    expect(result.current.equipmentIndex).toBeNull();
});

test('returns null values for null weapon', () => {
    const wrapperState = createCharacterTestWrapper({
        character: { equipment: [] },
    });

    const { result } = renderHook(
        () => useAmmoForWeapon(null),
        { wrapper: wrapperState.wrapper },
    );

    expect(result.current.ammoCount).toBeNull();
});

test('returns ammo count when matching ammo found in inventory', () => {
    const wrapperState = createCharacterTestWrapper({
        character: {
            equipment: [
                { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', amount: 7, tags: ['ammo'] },
                { key: 'torch', name: 'Torch', tags: ['tool'] },
                { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', amount: 3, tags: ['ammo'] },
            ],
        },
    });

    const { result } = renderHook(
        () => useAmmoForWeapon({ key: 'weapons.bow', name: 'Bow', ammoType: 'Arrow', tags: ['weapon', 'ranged'] }),
        { wrapper: wrapperState.wrapper },
    );

    expect(result.current.ammoCount).toBe(10);
    expect(result.current.ammoType).toBe('Arrow');
    expect(result.current.equipmentIndex).toBe(0);
});

test('counts duplicate ammo items as one each when amount is not present', () => {
    const wrapperState = createCharacterTestWrapper({
        character: {
            equipment: [
                { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'] },
                { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'] },
                { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'] },
            ],
        },
    });

    const { result } = renderHook(
        () => useAmmoForWeapon({ key: 'weapons.bow', name: 'Bow', ammoType: 'Arrow', tags: ['weapon', 'ranged'] }),
        { wrapper: wrapperState.wrapper },
    );

    expect(result.current.ammoCount).toBe(3);
    expect(result.current.equipmentIndex).toBe(0);
});

test('returns 0 when weapon needs ammo but none in inventory', () => {
    const wrapperState = createCharacterTestWrapper({
        character: {
            equipment: [
                { key: 'torch', name: 'Torch', tags: ['tool'] },
            ],
        },
    });

    const { result } = renderHook(
        () => useAmmoForWeapon({ key: 'weapons.bow', name: 'Bow', ammoType: 'Arrow', tags: ['weapon', 'ranged'] }),
        { wrapper: wrapperState.wrapper },
    );

    expect(result.current.ammoCount).toBe(0);
    expect(result.current.ammoType).toBe('Arrow');
    expect(result.current.equipmentIndex).toBeNull();
});
