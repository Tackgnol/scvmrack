import { client, type ApiOk as Ok } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { CharacterResponse } from "@/hooks/models";

export type SavedClass = Ok<"/api/classes/{id}">;
export type ClassDetail = Ok<"/api/classes/details/{id}">;
export type StoredClassDraft = Ok<"/api/classes/drafts/{draftId}">;
export type OwnClassSummary = Ok<"/api/classes/mine">[number];

/** A Custom Class as the creator edits it; the same shape is saved and test-rolled. */
export type ClassDraft = SavedClass["draft"];
export type ClassLanguage = ClassDraft["languages"][number];
export type Localized = ClassDraft["name"];
/** An origin text; a saved one carries its key, which the creator passes back untouched. */
export type OriginText = ClassDraft["origins"][number];
export type ClassStat = keyof ClassDraft["stats"];
export type StatDice = ClassDraft["stats"][ClassStat];
/** An ability as the creator edits it; a saved one carries its key, which the creator passes back untouched. */
export type AbilityDraft = ClassDraft["abilities"][number];
/** A stat modifier an ability carries; `exclude` names the rolls it doesn't apply to, as the sheet stores it. */
export type AbilityModifierDraft = AbilityDraft["modifiers"][number];
export type AbilityTableDraft = NonNullable<AbilityDraft["table"]>;
export type AbilityTableRowDraft = AbilityTableDraft["rows"][number];
/**
 * A Class Item as the creator edits it. `ref` is its saved key, or a `new:` id
 * until saved. Every type's fields are kept, so changing type loses nothing.
 */
export type ClassItemDraft = ClassDraft["items"][number];
export type ClassItemType = ClassItemDraft["type"];
export const CLASS_ITEM_TYPES = ["weapon", "armor", "gear", "pet"] as const satisfies readonly ClassItemType[];

const classClient = client as unknown as UntypedApiClient;

export const classKeys = {
  mine: (locale: string) => ["classes", "mine", locale] as const,
  one: (id: number) => ["classes", id] as const,
  detail: (id: number) => ["classes", "detail", id] as const,
  drafts: () => ["classes", "drafts"] as const,
  draft: (id: number) => ["classes", "drafts", id] as const,
  creationBan: () => ["classes", "creation-ban"] as const,
};

export async function getMyCreationBan(): Promise<{ banned: boolean }> {
  return unwrapApiResult(
    await classClient.GET<{ banned: boolean }>("/api/classes/creation-ban"),
    "Failed to load class creation status",
  );
}

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

export async function getClass(id: number): Promise<SavedClass> {
  return unwrapApiResult(
    await classClient.GET<SavedClass>(`/api/classes/${id}`),
    "Failed to load the class",
  );
}

export async function getClassDetail(id: number): Promise<ClassDetail> {
  return unwrapApiResult(
    await classClient.GET<ClassDetail>(`/api/classes/details/${id}`),
    "Failed to load the class",
  );
}

/** Lists unfinished private creator work, newest first. */
export async function listClassDrafts(): Promise<StoredClassDraft[]> {
  return unwrapApiResult(
    await classClient.GET<StoredClassDraft[]>("/api/classes/drafts"),
    "Failed to load your drafts",
  );
}

export async function getClassDraft(id: number): Promise<StoredClassDraft> {
  return unwrapApiResult(
    await classClient.GET<StoredClassDraft>(`/api/classes/drafts/${id}`),
    "Failed to load the draft",
  );
}

export async function createClassDraft(input: {
  classId: number | null;
  draft: ClassDraft;
}): Promise<StoredClassDraft> {
  return unwrapApiResult(
    await classClient.POST<StoredClassDraft>("/api/classes/drafts", {
      body: input,
    }),
    "Failed to save the draft",
  );
}

export async function updateClassDraft(input: {
  id: number;
  draft: ClassDraft;
  revision: number;
  force?: boolean;
}): Promise<StoredClassDraft> {
  return unwrapApiResult(
    await classClient.PUT<StoredClassDraft>(`/api/classes/drafts/${input.id}`, {
      body: {
        draft: input.draft,
        revision: input.revision,
        force: input.force,
      },
    }),
    "Failed to save the draft",
  );
}

export async function deleteClassDraft(id: number): Promise<void> {
  await unwrapApiResult(
    await classClient.DELETE<void>(`/api/classes/drafts/${id}`),
    "Failed to discard the draft",
  );
}
/** Saves a new class, or edits `id` when given. */
export async function saveClass(input: {
  id: number | null;
  draft: ClassDraft;
}): Promise<SavedClass> {
  const body = { draft: input.draft };
  return unwrapApiResult(
    input.id === null
      ? await classClient.POST<SavedClass>("/api/classes", { body })
      : await classClient.PUT<SavedClass>(`/api/classes/${input.id}`, { body }),
    "Failed to save the class",
  );
}

/** Deletes an unused lineage or archives it when existing scvm still need it. */
export async function removeClass(id: number): Promise<{ archived: boolean }> {
  return unwrapApiResult(
    await classClient.DELETE<{ archived: boolean }>(`/api/classes/${id}`),
    "Failed to remove the class",
  );
}

/** Restores a class lineage that the owner previously archived. */
export async function restoreClass(id: number): Promise<{ restored: boolean }> {
  return unwrapApiResult(
    await classClient.POST<{ restored: boolean }>(`/api/classes/${id}/restore`),
    "Failed to restore the class",
  );
}
/** Publishes a Custom Class after its creator confirms sharing rights. */
export async function publishClass(
  id: number,
): Promise<{ visibility: "public" }> {
  return unwrapApiResult(
    await classClient.POST<{ visibility: "public" }>(
      `/api/classes/${id}/publish`,
      {
        body: { confirmed: true },
      },
    ),
    "Failed to publish the class",
  );
}

/** Removes a Custom Class from public discovery and other GMs' pools. */
export async function unpublishClass(
  id: number,
): Promise<{ visibility: "private" }> {
  return unwrapApiResult(
    await classClient.POST<{ visibility: "private" }>(
      `/api/classes/${id}/unpublish`,
    ),
    "Failed to unpublish the class",
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

export async function disputeClassDecision(input: { id: number; text: string }): Promise<{ id: string }> {
  return unwrapApiResult(
    await classClient.POST<{ id: string }>(`/api/classes/${input.id}/disputes`, { body: { text: input.text } }),
    "Failed to submit dispute",
  );
}
