import { type EquipmentItem } from '@/hooks/models';
import { type AggregatedItem } from '@/utils/aggregateItems';

export function buildAggregateKey(
  aggregated: AggregatedItem<EquipmentItem>,
): string {
  const namePart = (aggregated.item.name ?? 'item').toLowerCase();
  const firstIndex = aggregated.indices[0] ?? 0;
  return `${namePart}-${firstIndex}`;
}
