export type AggregatedItem<T extends { name?: string | null; comments?: string | null }> = {
    item: T;
    indices: number[];
    quantity: number;
};

export function aggregateItems<T extends { name?: string | null; comments?: string | null }>(
    items: Array<T | null | undefined>
): Array<AggregatedItem<T>> {
    const groups = new Map<string, AggregatedItem<T>>();

    items.forEach((item, index) => {
        if (!item) return;

        const groupKey = (item.name || 'Unknown').toLowerCase();
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
