import prisma from '../lib/prisma.js';
import type { ClassSource, ClassVisibility } from '../lib/class-model.js';

export type PetCatalogRow = {
  key: string;
  hp: number;
  tags: string[];
  actionDie: number[];
  buff: unknown;
};

export type EquipCatalogRow = {
  key: string;
  tags: string[];
  value: number | null;
  ammoType: string | null;
  defaultAmount: number | null;
};

export type WeaponCatalogRow = {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  ammoType: string | null;
  modifiers: unknown;
};

export type ArmorCatalogRow = {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  maxTier: number | null;
  modifiers: unknown;
};

export type ClassCatalogRow = {
  id: number;
  name: string;
  appendix: string | null;
  nameKey: string | null;
  descriptionKey: string | null;
  languages: string[];
  source: ClassSource;
  visibility: ClassVisibility;
  creditWork: string | null;
  creditAuthor: string | null;
  ownerName: string | null;
  contentRemovedAt: Date | null;
  takenDownAt: Date | null;
};

export type AbilityTable = {
  abilityKey: string;
  die: number;
  rows: Array<{ roll: number; textKey: string; itemKey: string | null }>;
};

export type TranslationRow = {
  key: string;
  value: string;
};

export type MultiLocaleTranslationRow = {
  locale: string;
  key: string;
  value: string;
};

export type ClassAbilityModifierRow = {
  classId: number;
  abilityKey: string;
  value: number;
  source: string;
  statistic: string;
  exclude: unknown;
};

export type SearchCatalogResult = {
  weapons: Array<{ id: number; key: string; tags: string[] }>;
  armors: Array<{ id: number; key: string; tags: string[] }>;
  equipment: Array<{ id: number; key: string; tags: string[] }>;
  pets: Array<{ id: number; key: string; tags: string[] }>;
};

export type SharedCatalogItem = {
  key: string;
  itemType: 'weapon' | 'armor' | 'equipment' | 'pet';
};

export const catalogRepository = {
  findPetsByKeys(keys: string[]): Promise<PetCatalogRow[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.pet.findMany({
      where: { key: { in: keys } },
      select: { key: true, hp: true, tags: true, actionDie: true, buff: true },
    }) as Promise<PetCatalogRow[]>;
  },

  findEquipmentByKeys(keys: string[]): Promise<EquipCatalogRow[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.equipment.findMany({
      where: { key: { in: keys } },
      select: { key: true, tags: true, value: true, ammoType: true, defaultAmount: true },
    }) as Promise<EquipCatalogRow[]>;
  },

  findWeaponsByKeys(keys: string[]): Promise<WeaponCatalogRow[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.weapon.findMany({
      where: { key: { in: keys } },
      select: { key: true, dice: true, tags: true, value: true, ammoType: true, modifiers: true },
    }) as Promise<WeaponCatalogRow[]>;
  },

  findArmorsByKeys(keys: string[]): Promise<ArmorCatalogRow[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.armor.findMany({
      where: { key: { in: keys } },
      select: { key: true, dice: true, tags: true, value: true, maxTier: true, modifiers: true },
    }) as Promise<ArmorCatalogRow[]>;
  },

  findClassById(classId: number): Promise<ClassCatalogRow | null> {
    return prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true, name: true, appendix: true, nameKey: true, descriptionKey: true, languages: true,
        source: true, visibility: true, creditWork: true, creditAuthor: true, contentRemovedAt: true, takenDownAt: true, owner: { select: { name: true } },
      },
    }).then((row) => row && ({ ...row, ownerName: row.owner?.name ?? null })) as Promise<ClassCatalogRow | null>;
  },

  findTranslations(locale: string, keys: string[]): Promise<TranslationRow[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.translation.findMany({
      where: { locale, key: { in: keys } },
      select: { key: true, value: true },
    });
  },

  findTranslationsMultiLocale(keys: string[], locales: string[]): Promise<MultiLocaleTranslationRow[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.translation.findMany({
      where: { key: { in: keys }, locale: { in: locales } },
      select: { locale: true, key: true, value: true },
    });
  },

  async findAbilityTables(keys: string[]): Promise<AbilityTable[]> {
    if (keys.length === 0) {
      return [];
    }
    const abilities = await prisma.ability.findMany({
      where: { key: { in: keys }, tableDie: { not: null } },
      select: {
        key: true,
        tableDie: true,
        tableRows: { select: { roll: true, textKey: true, itemKey: true }, orderBy: { roll: 'asc' } },
      },
    });
    return abilities.map((ability) => ({
      abilityKey: ability.key,
      die: ability.tableDie!,
      rows: ability.tableRows,
    }));
  },

  findClassAbilityModifiers(classId: number, abilityKeys: string[]): Promise<ClassAbilityModifierRow[]> {
    if (abilityKeys.length === 0) {
      return Promise.resolve([]);
    }
    return prisma.classAbilityModifier.findMany({
      where: { classId, abilityKey: { in: abilityKeys } },
    }) as Promise<ClassAbilityModifierRow[]>;
  },

  async findAllItemsForSearch(): Promise<SearchCatalogResult> {
    const [weapons, armors, equipment, pets] = await Promise.all([
      // Class Items belong to their class; search offers only the shared catalog.
      prisma.weapon.findMany({ where: { classId: null }, select: { id: true, key: true, tags: true } }),
      prisma.armor.findMany({ where: { classId: null }, select: { id: true, key: true, tags: true } }),
      prisma.equipment.findMany({ where: { classId: null }, select: { id: true, key: true, tags: true } }),
      prisma.pet.findMany({ where: { classId: null }, select: { id: true, key: true, tags: true } }),
    ]);
    return { weapons, armors, equipment, pets };
  },

  /** Finds shared catalog items only, never Class Items owned by a Custom Class. */
  async findSharedItemsByKeys(keys: string[]): Promise<SharedCatalogItem[]> {
    if (keys.length === 0) {
      return [];
    }
    const where = { classId: null, key: { in: keys } };
    const [weapons, armors, equipment, pets] = await Promise.all([
      prisma.weapon.findMany({ where, select: { key: true } }),
      prisma.armor.findMany({ where, select: { key: true } }),
      prisma.equipment.findMany({ where, select: { key: true } }),
      prisma.pet.findMany({ where, select: { key: true } }),
    ]);
    return [
      ...weapons.map(({ key }) => ({ key, itemType: 'weapon' as const })),
      ...armors.map(({ key }) => ({ key, itemType: 'armor' as const })),
      ...equipment.map(({ key }) => ({ key, itemType: 'equipment' as const })),
      ...pets.map(({ key }) => ({ key, itemType: 'pet' as const })),
    ];
  },
};
