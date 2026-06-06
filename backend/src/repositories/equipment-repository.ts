import prisma from '../lib/prisma.js';
import type { SupportedItemType } from '../lib/item-search.js';

/**
 * Item data-access layer. One resolver each for by-id and by-key lookups across
 * the four item tables, replacing the duplicated if/else chains in the route.
 */

type ItemRow = Record<string, unknown> | null;

export const equipmentRepository = {
  findById(itemType: SupportedItemType, id: number): Promise<ItemRow> {
    switch (itemType) {
      case 'weapon':
        return prisma.weapon.findFirst({ where: { id } }) as Promise<ItemRow>;
      case 'armor':
        return prisma.armor.findFirst({ where: { id } }) as Promise<ItemRow>;
      case 'equipment':
        return prisma.equipment.findFirst({ where: { id } }) as Promise<ItemRow>;
      case 'pet':
        return prisma.pet.findFirst({ where: { id } }) as Promise<ItemRow>;
    }
  },

  findByKey(itemType: SupportedItemType, key: string): Promise<ItemRow> {
    switch (itemType) {
      case 'weapon':
        return prisma.weapon.findFirst({ where: { key } }) as Promise<ItemRow>;
      case 'armor':
        return prisma.armor.findFirst({ where: { key } }) as Promise<ItemRow>;
      case 'equipment':
        return prisma.equipment.findFirst({ where: { key } }) as Promise<ItemRow>;
      case 'pet':
        return prisma.pet.findFirst({ where: { key } }) as Promise<ItemRow>;
    }
  },
};
