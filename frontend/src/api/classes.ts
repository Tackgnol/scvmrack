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
export type AbilityModifierDraft = { statistic: ClassStat; value: number; exclude: string[] };

/** An ability as the creator edits it; a saved one carries its key, which the creator passes back untouched. */
export type AbilityDraft = {
  key?: string;
  random: boolean;
  name: Localized;
  text: Localized;
  modifiers: AbilityModifierDraft[];
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

export async function listMyClasses(locale: string): Promise<OwnClassSummary[]> {
  return unwrapApiResult(
    await classClient.GET<OwnClassSummary[]>("/api/classes/mine", {
      params: { query: { locale } },
    }),
    "Failed to load your classes",
  );
}

export async function getClass(id: number): Promise<{ id: number; draft: ClassDraft }> {
  return unwrapApiResult(
    await classClient.GET<{ id: number; draft: ClassDraft }>(`/api/classes/${id}`),
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
      ? await classClient.POST<{ id: number; draft: ClassDraft }>("/api/classes", { body })
      : await classClient.PUT<{ id: number; draft: ClassDraft }>(`/api/classes/${input.id}`, { body }),
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
