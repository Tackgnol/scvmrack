import { type EquipmentItem, type CustomItemCategory } from '@/hooks/models';

// Decide which glyph to render for an arbitrary inventory item. Custom items
// already carry `category` from the bundle builder; catalog items only have
// tags, so we infer from those. Falls back to 'misc' so KindGlyph always has
// something to draw.
export function itemGlyphKind(item: EquipmentItem): CustomItemCategory {
  const category = item.category;
  if (
    category === 'weapon' ||
    category === 'armor' ||
    category === 'ammo' ||
    category === 'consumable' ||
    category === 'misc'
  ) {
    return category;
  }

  const tags = item.tags ?? [];
  if (tags.includes('weapon') || tags.includes('shield')) return 'weapon';
  if (tags.includes('armor')) return 'armor';
  if (tags.includes('ammo')) return 'ammo';
  if (tags.includes('consumable')) return 'consumable';
  if (Array.isArray(item.uses) && item.uses.length > 0) return 'consumable';
  return 'misc';
}
