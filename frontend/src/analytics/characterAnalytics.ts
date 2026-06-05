import { trackEvent } from '@/analytics/googleAnalytics';
import type { OptimisticPatch } from '@/hooks/models';

/**
 * Maps a single patch to a stable, human-readable field name suitable for GA4.
 *
 * Simple field patches use their field name directly so GA can show e.g.
 * "currentHp edited 3 420 times".  Structural operations (equip, move,
 * inventory management) are grouped into a handful of meaningful categories
 * so reports stay readable without losing signal.
 */
function patchToField(patch: OptimisticPatch): string {
    switch (patch.kind) {
        // ── Simple scalar / text fields ──────────────────────────────────────
        case 'simple':
            return patch.field;

        // ── Armor/weapon stats (inline edits on the card) ────────────────────
        case 'armor':
            return 'armor_stats';
        case 'weapon':
            return 'weapon_stats';

        // ── Abilities ────────────────────────────────────────────────────────
        case 'abilities':
            return 'abilities';

        // ── Carried equipment ────────────────────────────────────────────────
        case 'equipment-add':
        case 'equipment-item':
        case 'equipment-remove':
        case 'equipment-move':
        case 'toggle-scroll-use':
            return 'equipment';

        // ── Storage (backpack / saddlebag) ───────────────────────────────────
        case 'storage-add':
        case 'storage-item':
        case 'storage-remove':
            return 'storage';

        // ── Moving items between containers ──────────────────────────────────
        case 'move-to-storage':
        case 'move-to-equipment':
        case 'swap-equipment-storage':
            return 'inventory_move';

        // ── Equipping / unequipping ───────────────────────────────────────────
        case 'equip-weapon':
        case 'unequip-weapon':
            return 'equippedWeapons';
        case 'equip-armor':
        case 'unequip-armor':
            return 'equippedArmor';

        // ── Custom modifiers ─────────────────────────────────────────────────
        case 'modifier-add':
        case 'modifier-remove':
        case 'modifier-update':
            return 'modifiers';
        default:
            return 'other';
    }
}

/**
 * Fire a single `character_edited` event summarising one debounced flush.
 *
 * GA4 receives:
 *   - `fields`       – sorted, deduplicated list of what was touched,
 *                      e.g. `"currentHp,equipment,silver"`.
 *   - `patch_count`  – raw number of patches in the batch (proxy for edit
 *                      intensity — a player hammering HP up/down scores high).
 *   - `locale`       – UI language at the time of the edit.
 *
 * Fires only when patches exist and only after a successful server save,
 * so it reflects real committed data rather than in-flight keystrokes.
 */
export function trackCharacterEdited(patches: OptimisticPatch[], locale: string): void {
    if (patches.length === 0) return;

    const fields = Array.from(new Set(patches.map(patchToField)))
        .sort()
        .join(',');

    trackEvent('character_edited', {
        fields,
        patch_count: patches.length,
        locale,
    });
}
