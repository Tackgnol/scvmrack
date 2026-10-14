import { client, type ApiLocale, type ApiOk } from "@/api";
import { unwrapApiResult } from "@/api/clientResult";

export type ClassPoolView = ApiOk<"/api/parties/{id}/class-pool">;
export type PoolClass = ClassPoolView["classes"][number];
export type RemovedPoolClass = ClassPoolView["removed"][number];
export type PoolGroup = PoolClass["group"];
export type PoolAttribution = NonNullable<PoolClass["attribution"]>;
export type GettingBetterRule = PoolClass["gettingBetterRule"];
export type ClassPoolLocale = ApiLocale;

export const classPoolKeys = {
  pool: (partyId: string, locale: ClassPoolLocale) =>
    ["party", partyId, "class-pool", locale] as const,
};

export async function getClassPool(partyId: string, locale: ClassPoolLocale): Promise<ClassPoolView> {
  return unwrapApiResult(
    await client.GET("/api/parties/{id}/class-pool", { params: { path: { id: partyId }, query: { locale } } }),
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
    await client.PUT("/api/parties/{id}/class-pool/lineages/{lineageId}", {
      params: { path: { id: input.partyId, lineageId: input.lineageId }, query: { locale: input.locale } },
      body: { enabled: input.enabled },
    }),
    "Failed to update the class pool",
  );
}

export async function setPoolClassless(input: {
  partyId: string;
  enabled: boolean;
  locale: ClassPoolLocale;
}): Promise<ClassPoolView> {
  return unwrapApiResult(
    await client.PUT("/api/parties/{id}/class-pool/classless", {
      params: { path: { id: input.partyId }, query: { locale: input.locale } },
      body: { enabled: input.enabled },
    }),
    "Failed to update the class pool",
  );
}
