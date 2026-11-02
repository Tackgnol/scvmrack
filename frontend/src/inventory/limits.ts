import type { TFunction } from 'i18next';

export const INVENTORY_LIMITS = { equipment: 50, storage: 100 } as const;

export function getInventoryLimitMessage(t: TFunction, location: keyof typeof INVENTORY_LIMITS): string {
  return t('equipment.inventoryLimit', '{{container}} is limited to {{limit}} items.', {
    container: location === 'equipment' ? t('equipment.onHand', 'On Hand') : t('equipment.storedItems', 'Stored Items'),
    limit: INVENTORY_LIMITS[location],
  });
}
