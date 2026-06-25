import { expect, test } from 'vitest';

import type { CharacterResponse } from '../../src/hooks/models.ts';
import { patchToRequest, buildRequestFromPatches } from '../../src/hooks/patchToRequest.ts';

test('patchToRequest handles simple patches', () => {
  expect(patchToRequest({ kind: 'simple', field: 'name', value: 'New Name' })).toEqual({ name: 'New Name' });
  expect(patchToRequest({ kind: 'simple', field: 'currentHp', value: 10 })).toEqual({ currentHp: 10 });
});

test('patchToRequest handles armor field patches', () => {
  expect(patchToRequest({ kind: 'armor', field: 'name', value: 'Mail' })).toEqual({
    equippedArmor: { name: 'Mail' }
  });
});

test('patchToRequest handles weapon field patches', () => {
  expect(patchToRequest({ kind: 'weapon', index: 0, field: 'name', value: 'Sword' })).toEqual({
    equippedWeapons: [{ index: 0, field: 'name', value: 'Sword' }]
  });
});

test('patchToRequest handles equipment patches', () => {
    const item = { key: 'torch', name: 'Torch' };
    expect(patchToRequest({ kind: 'equipment-item', index: 0, item })).toEqual({ equipment: [item] });
    expect(patchToRequest({ kind: 'equipment-add', item })).toEqual({ equipment: [item] });
    expect(patchToRequest({ kind: 'equipment-remove', index: 0 })).toEqual({ equipment: undefined });
});

test('patchToRequest handles abilities patches', () => {
    const abilities = [{ key: 'str', name: 'Str', description: 'Desc', comment: 'Comm' }];
    expect(patchToRequest({ kind: 'abilities', abilities })).toEqual({
        abilities: [{ key: 'str', name: 'Str', description: 'Desc', comment: 'Comm' }]
    });
});

test('buildRequestFromPatches handles multiple patches and state requirements', () => {
    const currentCharacter: CharacterResponse = {
        name: 'Old',
        equipment: [{ key: 'a', name: 'A' }],
        storage: [{ key: 's', name: 'S' }],
        equippedWeapons: [null, null],
        equippedArmor: null,
        modifiers: []
    } as any;

    const patches: any[] = [
        { kind: 'simple', field: 'name', value: 'New' },
        { kind: 'move-to-storage', equipmentIndex: 0 },
        { kind: 'modifier-add', modifier: {} }
    ];

    const result = buildRequestFromPatches(patches, currentCharacter);

    expect(result).toEqual({
        name: 'New',
        equipment: currentCharacter.equipment,
        storage: currentCharacter.storage,
        modifiers: currentCharacter.modifiers
    });
});

test('buildRequestFromPatches rejects outgoing strings beyond backend limits', () => {
    const currentCharacter: CharacterResponse = {
        name: 'Old',
        modifiers: [
            {
                id: 'm1',
                name: 'M'.repeat(300),
                statistic: 'agility',
            },
        ],
    } as any;

    expect(() =>
        buildRequestFromPatches(
            [
                { kind: 'simple', field: 'name', value: 'N'.repeat(300) },
                { kind: 'modifier-add', modifier: {} },
            ] as any,
            currentCharacter,
        )
    ).toThrow();
});

test('buildRequestFromPatches rejects outgoing shortened text limits', () => {
    expect(() =>
        buildRequestFromPatches(
            [
                {
                    kind: 'simple',
                    field: 'trait1',
                    value: 'T'.repeat(36),
                },
            ] as any,
            { name: 'Old' } as any,
        )
    ).toThrow();

    expect(() =>
        buildRequestFromPatches(
            [{ kind: 'equipment-item', index: 0, item: {} } as any],
            {
                equipment: [
                    {
                        key: 'item',
                        name: 'Item',
                        description: 'D'.repeat(251),
                    },
                ],
                storage: [],
                equippedWeapons: [],
                equippedArmor: null,
                modifiers: [],
            } as any,
        )
    ).toThrow();
});

test('buildRequestFromPatches clamps outgoing numbers and collection sizes', () => {
    const currentCharacter: CharacterResponse = {
        name: 'Old',
        notes: '',
        modifiers: [
            {
                id: 'm1',
                name: 'Modifier',
                value: 99,
                statistic: 'agility',
                exclude: Array(20).fill('defence'),
                comment: 'Comment',
            },
        ],
    } as any;

    const result = buildRequestFromPatches(
        [
            { kind: 'simple', field: 'name', value: 'Name' },
            { kind: 'simple', field: 'silver', value: 10000000 },
            { kind: 'simple', field: 'notes', value: 'line one\nline two' },
            { kind: 'modifier-add', modifier: {} },
        ] as any,
        currentCharacter,
    );

    expect(result.name).toBe('Name');
    expect(result.silver).toBe(1000000);
    expect(result.notes).toBe('line one\nline two');
    expect(result.modifiers?.[0].name).toBe('Modifier');
    expect(result.modifiers?.[0].value).toBe(20);
    expect(result.modifiers?.[0].exclude).toHaveLength(15);
    expect(result.modifiers?.[0].comment).toBe('Comment');
});

test('buildRequestFromPatches handles ammo-use', () => {
    const currentCharacter: CharacterResponse = {
        equipment: [
            { key: 'equipment.arrows', name: 'Arrows', amount: 5, ammoType: 'Arrow' },
        ],
    } as any;

    const result = buildRequestFromPatches(
        [{ kind: 'ammo-use', equipmentIndex: 0 }],
        currentCharacter
    );

    expect(result).toEqual({
        equipment: currentCharacter.equipment,
    });
});

test('buildRequestFromPatches handles weapon equipment/unequipment', () => {
    const currentCharacter: CharacterResponse = {
        equipment: [],
        equippedWeapons: [{ key: 'w', name: 'W' }, null],
    } as any;

    const result = buildRequestFromPatches(
        [{ kind: 'equip-weapon', equipmentIndex: 0, slotIndex: 1 }],
        currentCharacter
    );

    expect(result).toEqual({
        equipment: [],
        equippedWeapons: [{ key: 'w', name: 'W' }],
    });
});

test('patchToRequest throws for unhandled patch kind', () => {
    expect(() => patchToRequest({ kind: 'unknown' } as any)).toThrow('Unhandled patch kind');
});

test('buildRequestFromPatches handles armor-related patches', () => {
    const currentCharacter: CharacterResponse = {
        equipment: [],
        equippedArmor: null,
    } as any;

    const result = buildRequestFromPatches(
        [{ kind: 'equip-armor', equipmentIndex: 0 }],
        currentCharacter
    );

    expect(result).toEqual({
        equipment: [],
        equippedArmor: null,
    });
    
    const result2 = buildRequestFromPatches(
        [{ kind: 'unequip-armor' }],
        currentCharacter
    );
    expect(result2).toEqual({
        equipment: [],
        equippedArmor: null,
    });
});

test('buildRequestFromPatches handles toggle-scroll-use', () => {
    const currentCharacter: CharacterResponse = {
        equipment: [{ key: 'scroll', name: 'Scroll' }],
    } as any;

    const result = buildRequestFromPatches(
        [{ kind: 'toggle-scroll-use', equipmentIndex: 0, useIndex: 0 }],
        currentCharacter
    );

    expect(result).toEqual({
        equipment: currentCharacter.equipment,
    });
});
