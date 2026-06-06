export type AggregatedItem<T extends { name?: string | null; comments?: string | null }> = {
    item: T;
    indices: number[];
    quantity: number;
};

// Fields (beyond name) that make two same-named items genuinely different and so
// must NOT be merged into one stack. `comments` and `uses` are per-instance state
// and are deliberately excluded so identical copies still stack.
const IDENTITY_FIELDS = ['source', 'category', 'value', 'maxTier', 'ammoType', 'dice', 'modifiers'] as const;

function buildGroupKey<T extends { name?: string | null }>(item: T): string {
    const record = item as Record<string, unknown>;
    // A stable catalog/custom `key` fully identifies an item — prefer it. Custom
    // items get unique keys, so they correctly remain individual lines.
    if (typeof record.key === 'string' && record.key.length > 0) {
        return `key:${record.key}`;
    }
    // No key: compose a signature from the name plus identity-defining fields so
    // a d4 "Dagger" and a d6 "Dagger" don't collapse into one corrupted stack.
    const namePart = (item.name || 'Unknown').toLowerCase();
    const signature = IDENTITY_FIELDS.map((field) => JSON.stringify(record[field] ?? null)).join('|');
    return `${namePart}|${signature}`;
}

export function aggregateItems<T extends { name?: string | null; comments?: string | null }>(
    items: Array<T | null | undefined>
): Array<AggregatedItem<T>> {
    const groups = new Map<string, AggregatedItem<T>>();

    items.forEach((item, index) => {
        if (!item) return;

        const groupKey = buildGroupKey(item);
        const existing = groups.get(groupKey);

        if (existing) {
            existing.indices.push(index);
            existing.quantity += 1;

            if (item.comments && !existing.item.comments?.includes(item.comments)) {
                existing.item = {
                    ...existing.item,
                    comments: existing.item.comments
                        ? `${existing.item.comments}\n${item.comments}`
                        : item.comments,
                };
            }
            return;
        }

        groups.set(groupKey, {
            item: { ...item },
            indices: [index],
            quantity: 1,
        });
    });

    return Array.from(groups.values());
}
