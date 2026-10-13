import { client, type ApiLocale, type ApiOk } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";

export type ClassPoolView = ApiOk<"/api/parties/{id}/class-pool">;
export type PoolClass = ClassPoolView["classes"][number];
export type RemovedPoolClass = ClassPoolView["removed"][number];
export type PoolGroup = PoolClass["group"];
export type PoolAttribution = NonNullable<PoolClass["attribution"]>;
export type GettingBetterRule = PoolClass["gettingBetterRule"];
export type ClassPoolLocale = ApiLocale;

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
