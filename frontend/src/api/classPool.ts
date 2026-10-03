import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";

export type PoolGroup = "book" | "zine" | "rack" | "mine" | "public";

export type PoolAttribution =
  | { kind: "credit"; work: string; author: string; url: string | null }
  | { kind: "owner"; name: string | null; private: boolean };

export type GettingBetterRule = "book" | "book_plus_ability" | "specialist";

export type PoolClass = {
  lineageId: string;
  classId: number;
  group: PoolGroup;
  name: string;
  blurb: string | null;
  languages: string[];
  attribution: PoolAttribution | null;
  abilityCount: number;
  randomAbilityCount: number;
  classItemCount: number;
  gettingBetterRule: GettingBetterRule;
  version: number;
  playingHere: number;
  enabled: boolean;
};

export type RemovedPoolClass = {
  lineageId: string;
  name: string;
  by: string | null;
  reason: "archived" | "unpublished" | "taken_down";
};

export type ClassPoolView = {
  classlessEnabled: boolean;
  classes: PoolClass[];
  removed: RemovedPoolClass[];
};

export type ClassPoolLocale = "en" | "pl";

const poolClient = client as unknown as UntypedApiClient;

export const classPoolKeys = {
  pool: (partyId: string, locale: ClassPoolLocale) =>
    ["party", partyId, "class-pool", locale] as const,
};

export async function getClassPool(
  partyId: string,
  locale: ClassPoolLocale,
): Promise<ClassPoolView> {
  return unwrapApiResult(
    await poolClient.GET<ClassPoolView>(
      `/api/parties/${partyId}/class-pool`,
      { params: { query: { locale } } },
    ),
    "Failed to load the class pool",
  );
}

export async function setPoolClass(input: {
  partyId: string;
  lineageId: string;
  enabled: boolean;
  locale: ClassPoolLocale;
}): Promise<ClassPoolView> {
  return unwrapApiResult(
    await poolClient.PUT<ClassPoolView>(
      `/api/parties/${input.partyId}/class-pool/lineages/${input.lineageId}`,
      {
        params: { query: { locale: input.locale } },
        body: { enabled: input.enabled },
      },
    ),
    "Failed to update the class pool",
  );
}

export async function setPoolClassless(input: {
  partyId: string;
  enabled: boolean;
  locale: ClassPoolLocale;
}): Promise<ClassPoolView> {
  return unwrapApiResult(
    await poolClient.PUT<ClassPoolView>(
      `/api/parties/${input.partyId}/class-pool/classless`,
      {
        params: { query: { locale: input.locale } },
        body: { enabled: input.enabled },
      },
    ),
    "Failed to update the class pool",
  );
}
