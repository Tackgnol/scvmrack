import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { GettingBetterRule } from "@/api/classPool";
import type { CharacterResponse } from "@/hooks/models";
import type { AbilityStat } from "@/utils/stats";

export type ClassLanguage = "en" | "pl";
export type Localized = Record<ClassLanguage, string>;
/** An origin text; a saved one carries its key, which the creator passes back untouched. */
export type OriginText = Localized & { key?: string };
export type ClassStat = AbilityStat;
export type StatDice = {
  count: number;
  faces: number;
  modifier: number;
  dropLowest: boolean;
};

/** A stat modifier an ability carries; `exclude` names the rolls it doesn't apply to, as the sheet stores it. */
export type AbilityModifierDraft = {
  statistic: ClassStat;
  value: number;
  exclude: string[];
};

export type AbilityTableRowDraft = {
  text: Localized;
  itemRef: string | null;
};

export type AbilityTableDraft = {
  die: 2 | 3 | 4 | 6 | 8 | 10 | 12;
  rows: AbilityTableRowDraft[];
};

/** An ability as the creator edits it; a saved one carries its key, which the creator passes back untouched. */
export type AbilityDraft = {
  key?: string;
  random: boolean;
  name: Localized;
  text: Localized;
  modifiers: AbilityModifierDraft[];
  /** The Class Item (not a pet) it grants, by the item's `ref`. */
  grantItem: string | null;
  /** The pet Class Item it grants, by the item's `ref`. */
  grantPet: string | null;
  table: AbilityTableDraft | null;
};

export const CLASS_ITEM_TYPES = ["weapon", "armor", "gear", "pet"] as const;
export type ClassItemType = (typeof CLASS_ITEM_TYPES)[number];

/**
 * A Class Item as the creator edits it. `ref` is its saved key, or a `new:` id
 * until saved. Every type's fields are kept, so changing type loses nothing.
 */
export type ClassItemDraft = {
  ref: string;
  type: ClassItemType;
  name: Localized;
  description: Localized;
  value: number;
  weapon: {
    diceCount: number;
    diceFaces: number;
    damageModifier: number;
    reach: "melee" | "ranged";
    ammo: "none" | "counted" | "endless";
    ammoCount: number;
    ammoName: string;
    modifiers: AbilityModifierDraft[];
  };
  armor: { tier: number; modifiers: AbilityModifierDraft[] };
  gear: {
    kind: "consumable" | "wearable" | "carried";
    uses: number;
    effect: "text" | "damage" | "die";
    effectDie: number;
    statuses: AbilityModifierDraft[];
  };
  pet: {
    hp: number;
    actionDie: number;
    action: "attack" | "buff";
    humanoid: boolean;
    buffs: AbilityModifierDraft[];
  };
};

/** A Custom Class as the creator edits it; the same shape is saved and test-rolled. */
export type ClassDraft = {
  languages: ClassLanguage[];
  name: Localized;
  description: Localized;
  stats: Record<ClassStat, StatDice>;
  hpDie: number;
  omenDie: number;
  weaponDie: number;
  armorDie: number;
  silver: { count: number; faces: number; multiplier: number };
  origins: OriginText[];
  abilities: AbilityDraft[];
  randomAbilityCount: number;
  items: ClassItemDraft[];
  gettingBetterRule: GettingBetterRule;
  gettingBetterNote: Localized;
};

export type OwnClassSummary = {
  id: number;
  lineageId: string;
  name: string;
  description: string | null;
  languages: string[];
  visibility: "private" | "public";
  status: "draft" | "active" | "archived";
  originCount: number;
};

const classClient = client as unknown as UntypedApiClient;

export const classKeys = {
  mine: (locale: string) => ["classes", "mine", locale] as const,
  one: (id: number) => ["classes", id] as const,
};

export async function listMyClasses(
  locale: string,
): Promise<OwnClassSummary[]> {
  return unwrapApiResult(
    await classClient.GET<OwnClassSummary[]>("/api/classes/mine", {
      params: { query: { locale } },
    }),
    "Failed to load your classes",
  );
}

export async function getClass(
  id: number,
): Promise<{ id: number; draft: ClassDraft }> {
  return unwrapApiResult(
    await classClient.GET<{ id: number; draft: ClassDraft }>(
      `/api/classes/${id}`,
    ),
    "Failed to load the class",
  );
}

/** Saves a new class, or edits `id` when given. */
export async function saveClass(input: {
  id: number | null;
  draft: ClassDraft;
}): Promise<{ id: number; draft: ClassDraft }> {
  const body = { draft: input.draft };
  return unwrapApiResult(
    input.id === null
      ? await classClient.POST<{ id: number; draft: ClassDraft }>(
          "/api/classes",
          { body },
        )
      : await classClient.PUT<{ id: number; draft: ClassDraft }>(
          `/api/classes/${input.id}`,
          { body },
        ),
    "Failed to save the class",
  );
}

export async function testRollClass(input: {
  draft: ClassDraft;
  language: ClassLanguage;
  locale: string;
}): Promise<CharacterResponse> {
  return unwrapApiResult(
    await classClient.POST<CharacterResponse>("/api/classes/test-roll", {
      params: { query: { locale: input.locale } },
      body: { draft: input.draft, language: input.language },
    }),
    "Failed to roll a test scvm",
  );
}
