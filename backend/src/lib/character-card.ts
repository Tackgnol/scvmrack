// Compact, TABLE-VISIBLE projection of a hydrated character (getCharacterFull
// output). This is the ONLY character data exposed by the OBR room-card route:
// it powers the OBR GM roster and the "view scvm" peek after the caller presents
// a matching (roomId, characterId) binding. Allowlist only; never spread the full
// object. Private fields (notes, storage) must stay out, and inventory items are
// narrowed to name + description (no keys/modifiers/secret fields) because this
// data is meant to be visible at the table.

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
  computedModifiers: unknown[];
  bodyDescription: string | null;
  habit: string | null;
  origin: string | null;
  trait1: string | null;
  trait2: string | null;
}

export function toCharacterCard(full: Record<string, unknown>): CharacterCard {
  const weapons = Array.isArray(full.equippedWeapons) ? full.equippedWeapons : [];
  const armor = (full.equippedArmor ?? {}) as Record<string, unknown>;
  const equipment = Array.isArray(full.equipment) ? full.equipment : [];
  return {
    id: (full.id as string | null) ?? null,
    name: (full.name as string) ?? '',
    className: (full.className as string | null) ?? null,
    currentHp: (full.currentHp as number) ?? 0,
    maxHp: (full.maxHp as number) ?? 0,
    strength: (full.strength as number) ?? 0,
    agility: (full.agility as number) ?? 0,
    presence: (full.presence as number) ?? 0,
    toughness: (full.toughness as number) ?? 0,
    drToDodge: (full.drToDodge as number) ?? 0,
    drToMelee: (full.drToMelee as number) ?? 0,
    drToRanged: (full.drToRanged as number) ?? 0,
    omens: (full.omens as number) ?? 0,
    maxOmens: (full.maxOmens as number) ?? 0,
    silver: (full.silver as number) ?? 0,
    equippedWeapons: (weapons as unknown[]).map((raw) => {
      const w = (raw ?? {}) as Record<string, unknown>;
      return {
        name: (w.name as string | null) ?? null,
        dice: Array.isArray(w.dice) ? (w.dice as number[]) : [],
      };
    }),
    equippedArmor: compactArmor(armor),
    equipment: (equipment as unknown[])
      .map((raw) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        return {
          name: (item.name as string | null) ?? '',
          description: (item.description as string | null) ?? '',
        };
      })
      .filter((item) => item.name),
    computedModifiers: Array.isArray(full.computedModifiers) ? full.computedModifiers : [],
    bodyDescription: (full.bodyDescription as string | null) ?? null,
    habit: (full.habit as string | null) ?? null,
    origin: (full.origin as string | null) ?? null,
    trait1: (full.trait1 as string | null) ?? null,
    trait2: (full.trait2 as string | null) ?? null,
  };
}

function compactArmor(armor: Record<string, unknown>): CharacterCard['equippedArmor'] {
  const compact: CharacterCard['equippedArmor'] = {
    name: (armor.name as string | null) ?? null,
  };

  if (Array.isArray(armor.dice)) {
    compact.dice = (armor.dice as unknown[]).filter(
      (die): die is number => typeof die === 'number' && Number.isFinite(die),
    );
  }

  if (typeof armor.currentTier === 'number' && Number.isFinite(armor.currentTier)) {
    compact.currentTier = armor.currentTier;
  }

  if (typeof armor.maxTier === 'number' && Number.isFinite(armor.maxTier)) {
    compact.maxTier = armor.maxTier;
  }

  return compact;
}
