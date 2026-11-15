// Compact, TABLE-VISIBLE projection of a hydrated character (getCharacterFull
// output). This is the ONLY character data exposed by the OBR room-card route:
// it powers the OBR GM roster and the "view scvm" peek after the caller presents
// a matching (roomId, characterId) binding. Allowlist only; never spread the full
// object. Private fields (notes, storage) must stay out, and inventory items are
// narrowed to name + description (no keys/modifiers/secret fields) because this
// data is meant to be visible at the table.

import type { CharacterSheet } from '../schemas/character.js';

export interface CharacterCard {
  id: string | null;
  name: string;
  className: string | null;
  currentHp: number;
  maxHp: number;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  drToDodge: number;
  drToMelee: number;
  drToRanged: number;
  omens: number;
  maxOmens: number;
  silver: number;
  equippedWeapons: Array<{ name: string | null; dice: number[] }>;
  equippedArmor: {
    name: string | null;
    dice?: number[];
    currentTier?: number;
    maxTier?: number;
  };
  // Carried inventory, narrowed to table-visible name + description. Aggregation
  // (x2 etc.) is the renderer's job, mirroring the full-sheet warband path.
  equipment: Array<{ name: string; description: string }>;
  computedModifiers: CharacterSheet['computedModifiers'];
  bodyDescription: string | null;
  habit: string | null;
  origin: string | null;
  trait1: string | null;
  trait2: string | null;
}

/** The sheet fields a card is projected from. */
export type CardSource = Pick<
  CharacterSheet,
  | 'id'
  | 'name'
  | 'className'
  | 'currentHp'
  | 'maxHp'
  | 'strength'
  | 'agility'
  | 'presence'
  | 'toughness'
  | 'drToDodge'
  | 'drToMelee'
  | 'drToRanged'
  | 'omens'
  | 'maxOmens'
  | 'silver'
  | 'equippedWeapons'
  | 'equippedArmor'
  | 'equipment'
  | 'computedModifiers'
  | 'bodyDescription'
  | 'habit'
  | 'origin'
  | 'trait1'
  | 'trait2'
>;

/** Projects a hydrated sheet onto its table-visible card. */
export function toCharacterCard(full: CardSource): CharacterCard {
  return {
    id: full.id,
    name: full.name,
    className: full.className,
    currentHp: full.currentHp,
    maxHp: full.maxHp,
    strength: full.strength,
    agility: full.agility,
    presence: full.presence,
    toughness: full.toughness,
    drToDodge: full.drToDodge,
    drToMelee: full.drToMelee,
    drToRanged: full.drToRanged,
    omens: full.omens,
    maxOmens: full.maxOmens,
    silver: full.silver,
    equippedWeapons: full.equippedWeapons.map((weapon) => ({
      name: weapon.name ?? null,
      dice: weapon.dice ?? [],
    })),
    equippedArmor: compactArmor(full.equippedArmor ?? {}),
    equipment: full.equipment
      .map((item) => ({
        name: item.name ?? '',
        description: item.description ?? '',
      }))
      .filter((item) => item.name),
    computedModifiers: full.computedModifiers,
    bodyDescription: full.bodyDescription,
    habit: full.habit,
    origin: full.origin,
    trait1: full.trait1,
    trait2: full.trait2,
  };
}

function compactArmor(armor: NonNullable<CharacterSheet['equippedArmor']>): CharacterCard['equippedArmor'] {
  const compact: CharacterCard['equippedArmor'] = {
    name: armor.name ?? null,
  };

  if (Array.isArray(armor.dice)) {
    compact.dice = armor.dice.filter((die) => Number.isFinite(die));
  }

  if (typeof armor.currentTier === 'number' && Number.isFinite(armor.currentTier)) {
    compact.currentTier = armor.currentTier;
  }

  if (typeof armor.maxTier === 'number' && Number.isFinite(armor.maxTier)) {
    compact.maxTier = armor.maxTier;
  }

  return compact;
}
