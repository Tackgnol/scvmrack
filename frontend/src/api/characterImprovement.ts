import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { CharacterResponse } from "@/hooks/models";
import type {
  ImprovementDraft,
  ImprovementPreview,
  ImprovementRerollSection,
} from "./characterImprovementTypes";

const improvementClient = client as unknown as UntypedApiClient;

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
  const query = input.locale
    ? `?locale=${encodeURIComponent(input.locale)}`
    : "";
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
