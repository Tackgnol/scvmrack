import { type EquipmentItem } from '@/hooks/models';

export function isScrollItem(item: EquipmentItem): boolean {
  return item.key?.startsWith('scroll.') ?? false;
}

export function isPetItem(item: EquipmentItem): boolean {
  const tags = item.tags ?? [];
  const key = item.key ?? '';
  return tags.includes('pet') || key.startsWith('pet.') || key.startsWith('pets.');
}

export function isAmmoItem(item: EquipmentItem): boolean {
  const tags = item.tags ?? [];
  return tags.includes('ammo') || Boolean(item.ammoType);
}

export function isConsumableUseItem(item: EquipmentItem): boolean {
  const tags = item.tags ?? [];
  return (
    tags.includes('consumable') &&
    !isAmmoItem(item) &&
    !isScrollItem(item) &&
    !isPetItem(item) &&
    (item.uses?.length ?? 0) > 0
  );
}

export function isEncumbranceExemptItem(item: EquipmentItem): boolean {
  const tags = item.tags ?? [];
  return (
    isAmmoItem(item) ||
    tags.includes('carry') ||
    tags.includes('pet') ||
    item.key?.startsWith('pet.') === true ||
    item.key?.startsWith('pets.') === true
  );
}
