import { characterKeys, client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { CharacterResponse } from "@/hooks/models";

export type AbilityStat = "strength" | "agility" | "presence" | "toughness";
export type RollSource = "server" | "table";
export type ImprovementRerollSection =
  | "hp"
  | "debris"
  | "abilities"
  | "scumSpecialties"
  | "all";

export type RollValue = {
  source: RollSource;
  dice?: number[];
  total: number;
};

export type ImprovementCharacterSnapshot = {
  characterUpdatedAt: string;
  maxHp: number;
  silver: number;
  abilities: Record<AbilityStat, number>;
  abilityKeys: string[];
  equipmentFingerprint: string;
  snapshotHash: string;
};

export type ImprovementHpRoll = {
  check: RollValue;
  fromMaxHp: number;
  succeeds: boolean;
  increase: RollValue | null;
  toMaxHp: number;
};

export type ImprovementDebrisRoll =
  | { roll: RollValue; kind: "nothing" }
  | { roll: RollValue; kind: "silver"; silver: RollValue; amount: number }
  | {
      roll: RollValue;
      kind: "uncleanScroll";
      scroll: RollValue;
      itemKey: string;
    }
  | {
      roll: RollValue;
      kind: "sacredScroll";
      scroll: RollValue;
      itemKey: string;
    };

export type ImprovementAbilityRoll = {
  roll: RollValue;
  fromScore: number;
  fromModifier: number;
  toModifier: number;
  toScore: number;
  outcome: "increase" | "decrease" | "same";
};

export type SpecialtySlot = {
  key: string;
  rollValue: number;
};

export type SpecialtyRoll = SpecialtySlot & {
  roll: RollValue;
};

export type ScumSpecialtyDraft =
  | { kind: "notScum" }
  | {
      kind: "firstImprovement";
      existing: SpecialtySlot;
      added: SpecialtyRoll;
    }
  | {
      kind: "laterImprovement";
      primary: SpecialtySlot;
      secondary: SpecialtySlot;
      rerollMode: "none" | "primary" | "secondary" | "both";
    };

export type ImprovementDraft = {
  sequence: number;
  snapshot: ImprovementCharacterSnapshot;
  hp: ImprovementHpRoll;
  debris: ImprovementDebrisRoll;
  abilities: Record<AbilityStat, ImprovementAbilityRoll>;
  scumSpecialties: ScumSpecialtyDraft;
};

export type ImprovementPreview = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: ImprovementDraft;
  scumSpecialtyNames: Record<string, string>;
  snapshotHash: string;
  createdAt: string;
  updatedAt: string;
};

const improvementClient = client as unknown as UntypedApiClient;

export const characterImprovementKeys = {
  preview: (characterId: string) =>
    ["character-improvement", characterId, "preview"] as const,
  ...characterKeys,
};

export async function getOrCreateImprovementPreview(
  characterId: string,
  locale?: string,
): Promise<ImprovementPreview> {
  const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  return unwrapApiResult(
    await improvementClient.POST<ImprovementPreview>(
      `/api/characters/${characterId}/improvements/preview${query}`,
    ),
    "Failed to roll getting better preview",
  );
}

export async function rerollImprovementSection(input: {
  characterId: string;
  improvementId: string;
  section: ImprovementRerollSection;
  locale?: string;
}): Promise<ImprovementPreview> {
  const query = input.locale ? `?locale=${encodeURIComponent(input.locale)}` : "";
  return unwrapApiResult(
    await improvementClient.POST<ImprovementPreview>(
      `/api/characters/${input.characterId}/improvements/${input.improvementId}/reroll/${input.section}${query}`,
    ),
    "Failed to reroll getting better section",
  );
}

export async function applyImprovement(input: {
  characterId: string;
  improvementId: string;
  draft: ImprovementDraft;
  locale?: string;
}): Promise<CharacterResponse> {
  const query = input.locale
    ? `?locale=${encodeURIComponent(input.locale)}`
    : "";

  return unwrapApiResult(
    await improvementClient.POST<CharacterResponse>(
      `/api/characters/${input.characterId}/improvements/${input.improvementId}/apply${query}`,
      { body: { draft: input.draft } },
    ),
    "Failed to apply getting better",
  );
}
