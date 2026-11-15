import prisma from '../lib/prisma.js';
import { CLASSLESS_DEFAULTS } from '../lib/classless-defaults.js';
import type { AbilityStat } from '../lib/draft-seeds.js';
import type {
  ClassSpec,
  RollInputs,
  RollTables,
  StatDice,
} from '../lib/generate-character.js';

/** A stored class as the generator rolls it; throws if `classId` does not exist. */
async function loadClassSpec(classId: number): Promise<ClassSpec> {
  const [cls, origins, abilities] = await Promise.all([
    prisma.class.findUniqueOrThrow({ where: { id: classId } }),
    prisma.origin.findMany({ where: { classId }, select: { key: true } }),
    prisma.ability.findMany({
      where: { classId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: { id: true, key: true, isRandom: true, position: true, grantItemKey: true, grantPetKey: true },
    }),
  ]);
  return {
    hpDie: cls.hpDie ?? CLASSLESS_DEFAULTS.hpDie,
    omenDie: cls.omenDie,
    weaponDie: cls.weaponDie ?? CLASSLESS_DEFAULTS.weaponDie,
    armorDie: cls.armorDie ?? CLASSLESS_DEFAULTS.armorDie,
    silverDice: cls.silverDice,
    silverModifier: cls.silverModifier ?? CLASSLESS_DEFAULTS.silverModifier,
    statDice: cls.statDice as Record<AbilityStat, StatDice>,
    originKeys: origins.map((o) => o.key),
    abilities,
    randomAbilityCount: cls.randomAbilityCount ?? 0,
  };
}

/** The whole item catalog (Class Items included) and the name and personality tables. */
async function loadTables(): Promise<RollTables> {
  const [names, weapons, armors, equipment, pets, habits, tales, bodyDescriptions, traits] =
    await Promise.all([
      prisma.name.findMany({ select: { name: true } }),
      prisma.weapon.findMany({
        orderBy: { id: 'asc' },
        select: { key: true, tags: true, roll: true, ammoType: true, defaultAmount: true },
      }),
      prisma.armor.findMany({ select: { key: true, tags: true, maxTier: true, classId: true } }),
      prisma.equipment.findMany({ select: { key: true, tags: true, defaultAmount: true, classId: true } }),
      prisma.pet.findMany({ select: { key: true, tags: true, hp: true } }),
      prisma.habit.findMany({ select: { key: true } }),
      prisma.tale.findMany({ select: { key: true } }),
      prisma.bodyDescription.findMany({ select: { key: true } }),
      prisma.trait.findMany({ select: { key: true } }),
    ]);
  return {
    names: names.map((row) => row.name),
    weapons,
    armors,
    equipment,
    pets,
    habits: habits.map((row) => row.key),
    tales: tales.map((row) => row.key),
    bodyDescriptions: bodyDescriptions.map((row) => row.key),
    traits: traits.map((row) => row.key),
  };
}

export const rollInputsRepository = {
  /** Everything one roll of `classId` needs (null rolls classless); throws if the class does not exist. */
  async load(classId: number | null): Promise<RollInputs> {
    const spec = classId !== null ? await loadClassSpec(classId) : null;
    return { classId, spec, tables: await loadTables() };
  },

  loadTables,
};
