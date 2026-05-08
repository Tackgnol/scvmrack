import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { OptimisticPatch } from '@/hooks/models';
import { trackCharacterEdited } from '@/analytics/characterAnalytics';

// Mock dependencies
vi.mock('@/analytics/googleAnalytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('@/platform/runtime', () => ({
    isBrowserRuntime: () => true,
}));

vi.mock('@/privacy/privacySettings', () => ({
    getPrivacySettings: () => ({ acknowledged: true, analyticsEnabled: true }),
    isAnalyticsAllowed: () => true,
}));

import { trackEvent } from '@/analytics/googleAnalytics';

describe('trackCharacterEdited', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('tracks simple field edits', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'simple', field: 'currentHp', value: 10 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'currentHp',
            patch_count: 1,
            locale: 'en',
        });
    });

    it('sorts and deduplicates field names', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'simple', field: 'silver', value: 100 },
            { kind: 'equipment-add', item: { name: 'Sword' } },
            { kind: 'equip-weapon', equipmentIndex: 0, slotIndex: 0 },
            { kind: 'simple', field: 'currentHp', value: 10 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            // Fields are sorted alphabetically: currentHp, equipment, equippedWeapons, silver
            fields: 'currentHp,equipment,equippedWeapons,silver',
            patch_count: 4,
            locale: 'en',
        });
    });

    it('does not fire when patches array is empty', () => {
        trackCharacterEdited([], 'en');

        expect(trackEvent).not.toHaveBeenCalled();
    });

    it('groups multiple equipment operations into single equipment field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'equipment-add', item: { name: 'Sword' } },
            { kind: 'equipment-item', index: 0, item: { name: 'Shield' } },
            { kind: 'equipment-remove', index: 1 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'equipment',
            patch_count: 3,
            locale: 'en',
        });
    });

    it('groups equip and unequip into same equippedWeapons field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'equip-weapon', equipmentIndex: 0, slotIndex: 0 },
            { kind: 'unequip-weapon', slotIndex: 0 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'equippedWeapons',
            patch_count: 2,
            locale: 'en',
        });
    });

    it('maps armor kind to armor_stats', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'armor', field: 'dice', value: 6 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'armor_stats',
            patch_count: 1,
            locale: 'en',
        });
    });

    it('maps weapon kind to weapon_stats', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'weapon', index: 0, field: 'dice', value: 'd6' },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'weapon_stats',
            patch_count: 1,
            locale: 'en',
        });
    });

    it('maps abilities kind to abilities', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'abilities', abilities: [{ name: 'Strike', description: 'Attack first' }] },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'abilities',
            patch_count: 1,
            locale: 'en',
        });
    });

    it('maps storage operations to storage field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'storage-add', item: { name: 'Potion' } },
            { kind: 'storage-item', index: 0, item: { name: 'Potion' } },
            { kind: 'storage-remove', index: 1 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'storage',
            patch_count: 3,
            locale: 'en',
        });
    });

    it('maps inventory move operations to inventory_move field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'move-to-storage', equipmentIndex: 0 },
            { kind: 'move-to-equipment', storageIndex: 0 },
            { kind: 'swap-equipment-storage', equipmentIndex: 0, storageIndex: 1 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'inventory_move',
            patch_count: 3,
            locale: 'en',
        });
    });

    it('maps equip-armor and unequip-armor to equippedArmor field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'equip-armor', equipmentIndex: 0 },
            { kind: 'unequip-armor' },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'equippedArmor',
            patch_count: 2,
            locale: 'en',
        });
    });

    it('maps modifier operations to modifiers field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'modifier-add', modifier: { name: 'Strength Boost', value: 2 } },
            { kind: 'modifier-remove', modifierId: 'mod-1' },
            { kind: 'modifier-update', modifierId: 'mod-1', modifier: { value: 5 } },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'modifiers',
            patch_count: 3,
            locale: 'en',
        });
    });

    it('maps toggle-scroll-use to equipment field', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'toggle-scroll-use', equipmentIndex: 0, useIndex: 0 },
        ];

        trackCharacterEdited(patches, 'en');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'equipment',
            patch_count: 1,
            locale: 'en',
        });
    });

    it('includes locale in the tracked event', () => {
        const patches: OptimisticPatch[] = [
            { kind: 'simple', field: 'name', value: 'Grim' },
        ];

        trackCharacterEdited(patches, 'pl');

        expect(trackEvent).toHaveBeenCalledWith('character_edited', {
            fields: 'name',
            patch_count: 1,
            locale: 'pl',
        });
    });
});
