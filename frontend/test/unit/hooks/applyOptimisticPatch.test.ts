import { expect, test } from 'vitest';
import { CharacterResponse } from '../../../src/hooks/models.ts';
import { applyOptimisticPatch } from '../../../src/hooks/applyOptimisticPatch.ts';

const baseCharacter: CharacterResponse = {
  id: 'char-1',
  name: 'Test',
  equipment: [{ key: 'torch', name: 'Torch' }],
  storage: [{ key: 'gold', name: 'Gold' }],
  equippedWeapons: [{ key: 'dagger', name: 'Dagger' }, null as any],
  equippedArmor: { key: 'rags', name: 'Rags' },
  abilities: [],
  modifiers: [{ id: 'mod-1', name: 'Bonus' }]
} as any;

test('applyOptimisticPatch handles simple patches', () => {
  const result = applyOptimisticPatch(baseCharacter, { kind: 'simple', field: 'name', value: 'New Name' });
  expect(result.name).toBe('New Name');
});

test('applyOptimisticPatch handles armor field patches', () => {
  const result = applyOptimisticPatch(baseCharacter, { kind: 'armor', field: 'name', value: 'Studded' });
  expect(result.equippedArmor?.name).toBe('Studded');
  
  const noArmorChar = { ...baseCharacter, equippedArmor: null };
  expect(applyOptimisticPatch(noArmorChar, { kind: 'armor', field: 'name', value: 'X' })).toBe(noArmorChar);
});

test('applyOptimisticPatch handles weapon field patches', () => {
  const result = applyOptimisticPatch(baseCharacter, { kind: 'weapon', index: 0, field: 'name', value: 'Silver Dagger' });
  expect(result.equippedWeapons![0]?.name).toBe('Silver Dagger');
  
  expect(applyOptimisticPatch(baseCharacter, { kind: 'weapon', index: 1, field: 'name', value: 'X' })).toBe(baseCharacter);
});

test('applyOptimisticPatch handles equipment management', () => {
  // item update
  const item = { key: 'rope', name: 'Rope' };
  const r1 = applyOptimisticPatch(baseCharacter, { kind: 'equipment-item', index: 0, item });
  expect(r1.equipment![0]).toEqual(item);

  // add
  const r2 = applyOptimisticPatch(baseCharacter, { kind: 'equipment-add', item });
  expect(r2.equipment).toHaveLength(2);
  expect(r2.equipment![1]).toEqual(item);

  // remove
  const r3 = applyOptimisticPatch(baseCharacter, { kind: 'equipment-remove', index: 0 });
  expect(r3.equipment).toHaveLength(0);

  // move
  const r4 = applyOptimisticPatch({ ...baseCharacter, equipment: [item, { key: 'a' }] as any }, { kind: 'equipment-move', from: 0, to: 1 });
  expect(r4.equipment![1]).toEqual(item);
});

test('applyOptimisticPatch ignores out-of-bounds equipment operations', () => {
  expect(
    applyOptimisticPatch(baseCharacter, {
      kind: 'equipment-item',
      index: 4,
      item: { key: 'rope', name: 'Rope' },
    })
  ).toBe(baseCharacter);

  expect(
    applyOptimisticPatch(baseCharacter, { kind: 'equipment-remove', index: -1 })
  ).toBe(baseCharacter);

  expect(
    applyOptimisticPatch(baseCharacter, { kind: 'equipment-move', from: 2, to: 0 })
  ).toBe(baseCharacter);
});

test('applyOptimisticPatch handles storage management', () => {
    const item = { key: 'gem', name: 'Gem' };
    const r1 = applyOptimisticPatch(baseCharacter, { kind: 'storage-item', index: 0, item });
    expect(r1.storage![0]).toEqual(item);

    const r2 = applyOptimisticPatch(baseCharacter, { kind: 'storage-add', item });
    expect(r2.storage).toHaveLength(2);

    const r3 = applyOptimisticPatch(baseCharacter, { kind: 'storage-remove', index: 0 });
    expect(r3.storage).toHaveLength(0);
});

test('applyOptimisticPatch ignores out-of-bounds storage operations', () => {
    expect(
        applyOptimisticPatch(baseCharacter, {
            kind: 'storage-item',
            index: 2,
            item: { key: 'gem', name: 'Gem' },
        })
    ).toBe(baseCharacter);

    expect(
        applyOptimisticPatch(baseCharacter, { kind: 'storage-remove', index: -1 })
    ).toBe(baseCharacter);
});

test('applyOptimisticPatch handles move between equipment and storage', () => {
    // to storage
    const r1 = applyOptimisticPatch(baseCharacter, { kind: 'move-to-storage', equipmentIndex: 0 });
    expect(r1.equipment).toHaveLength(0);
    expect(r1.storage).toHaveLength(2);
    expect(r1.storage![1].key).toBe('torch');

    // to equipment
    const r2 = applyOptimisticPatch(baseCharacter, { kind: 'move-to-equipment', storageIndex: 0, equipmentPosition: 0 });
    expect(r2.storage).toHaveLength(0);
    expect(r2.equipment).toHaveLength(2);
    expect(r2.equipment![0].key).toBe('gold');
    
    // swap
    const r3 = applyOptimisticPatch(baseCharacter, { kind: 'swap-equipment-storage', equipmentIndex: 0, storageIndex: 0 });
    expect(r3.equipment![0].key).toBe('gold');
    expect(r3.storage![0].key).toBe('torch');
});

test('applyOptimisticPatch appends moved storage items when equipmentPosition is invalid and ignores bad source indices', () => {
    const appended = applyOptimisticPatch(baseCharacter, {
        kind: 'move-to-equipment',
        storageIndex: 0,
        equipmentPosition: -1,
    });
    expect(appended.equipment![appended.equipment!.length - 1].key).toBe('gold');

    const result = applyOptimisticPatch(baseCharacter, {
        kind: 'move-to-equipment',
        storageIndex: 9,
        equipmentPosition: 0,
    });
    expect(result).toBe(baseCharacter);
});

test('applyOptimisticPatch handles weapon equip/unequip', () => {
    // equip
    const r1 = applyOptimisticPatch(baseCharacter, { kind: 'equip-weapon', equipmentIndex: 0, slotIndex: 1 });
    expect(r1.equipment).toHaveLength(0); // moved torch to weapons[1]
    expect(r1.equippedWeapons![1]?.key).toBe('torch');
    
    // unequip
    const r2 = applyOptimisticPatch(baseCharacter, { kind: 'unequip-weapon', slotIndex: 0 });
    expect(r2.equippedWeapons).toHaveLength(0); // removed dagger
    expect(r2.equipment).toHaveLength(2); // dagger added to equipment
    expect(r2.equipment![1].key).toBe('dagger');
});

test('applyOptimisticPatch ignores invalid weapon slot targets', () => {
    expect(
        applyOptimisticPatch(baseCharacter, {
            kind: 'equip-weapon',
            equipmentIndex: 0,
            slotIndex: -1,
        })
    ).toBe(baseCharacter);
});

test('applyOptimisticPatch handles armor equip/unequip', () => {
    // equip
    const r1 = applyOptimisticPatch(baseCharacter, { kind: 'equip-armor', equipmentIndex: 0 });
    expect(r1.equippedArmor?.key).toBe('torch');
    expect(r1.equipment![0].key).toBe('rags'); // old armor moved back

    // unequip
    const r2 = applyOptimisticPatch(baseCharacter, { kind: 'unequip-armor' });
    expect(r2.equippedArmor).toBeNull();
    expect(r2.equipment).toHaveLength(2);
    expect(r2.equipment![1].key).toBe('rags');
});

test('applyOptimisticPatch handles modifiers', () => {
    const mod = { id: 'mod-2', name: 'New' };
    const r1 = applyOptimisticPatch(baseCharacter, { kind: 'modifier-add', modifier: mod as any });
    expect(r1.modifiers).toHaveLength(2);

    const r2 = applyOptimisticPatch(baseCharacter, { kind: 'modifier-update', modifierId: 'mod-1', modifier: { name: 'Updated' } as any });
    expect(r1.modifiers![0].name).toBe('Bonus');
    expect(r2.modifiers![0].name).toBe('Updated');

    const r3 = applyOptimisticPatch(baseCharacter, { kind: 'modifier-remove', modifierId: 'mod-1' });
    expect(r3.modifiers).toHaveLength(0);
});

test('applyOptimisticPatch handles ammo-use', () => {
    const charWithAmmo = {
        ...baseCharacter,
        equipment: [
            { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'], amount: 3 },
            { key: 'equipment.rope', name: 'Rope' },
        ]
    } as any;

    const r1 = applyOptimisticPatch(charWithAmmo, { kind: 'ammo-use', equipmentIndex: 0 });
    expect(r1.equipment).toHaveLength(2);
    expect(r1.equipment![0].amount).toBe(2);

    const r2 = applyOptimisticPatch(
        {
            ...charWithAmmo,
            equipment: [
                { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'], amount: 1 },
                { key: 'equipment.rope', name: 'Rope' },
            ],
        } as any,
        { kind: 'ammo-use', equipmentIndex: 0 }
    );

    expect(r2.equipment).toHaveLength(1);
    expect(r2.equipment![0].name).toBe('Rope');
});

test('applyOptimisticPatch handles ammo-use for duplicate single-arrow items', () => {
    const charWithAmmo = {
        ...baseCharacter,
        equipment: [
            { key: 'equipment.arrows', name: 'Arrows', ammoType: 'Arrow', tags: ['ammo'] },
            { key: 'equipment.rope', name: 'Rope' },
        ]
    } as any;

    const r1 = applyOptimisticPatch(charWithAmmo, { kind: 'ammo-use', equipmentIndex: 0 });
    expect(r1.equipment).toHaveLength(1);
    expect(r1.equipment![0].name).toBe('Rope');
});

test('applyOptimisticPatch handles scrolls', () => {
    const charWithScroll = {
        ...baseCharacter,
        equipment: [{ key: 'scroll', name: 'Scroll' }]
    } as any;
    
    const r1 = applyOptimisticPatch(charWithScroll, { kind: 'toggle-scroll-use', equipmentIndex: 0, useIndex: 1 });
    expect(r1.equipment![0].uses).toHaveLength(4);
    expect(r1.equipment![0].uses![1]).toBe(true);
    
    const r2 = applyOptimisticPatch(r1, { kind: 'toggle-scroll-use', equipmentIndex: 0, useIndex: 1 });
    expect(r2.equipment![0].uses![1]).toBe(false);
});
