import { client, type ApiLocale, type ApiOk as Ok } from "@/api";
import { unwrapApiResult } from "@/api/clientResult";
import type { paths } from "@/api/schema";
import type { CharacterResponse } from "@/hooks/models";

export type SavedClass = Ok<"/api/classes/{id}">;
/** A save response: the saved class plus the saved key each `new:` Class Item ref became. */
export type SavedClassWithRefs = paths["/api/classes"]["post"]["responses"][201]["content"]["application/json"];
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

export const classKeys = {
  all: () => ["classes"] as const,
  mine: (locale: string) => ["classes", "mine", locale] as const,
  one: (id: number) => ["classes", id] as const,
  detail: (id: number, locale: string) => ["classes", "detail", id, locale] as const,
  drafts: () => ["classes", "drafts"] as const,
  draft: (id: number) => ["classes", "drafts", id] as const,
  creationBan: () => ["classes", "creation-ban"] as const,
};

const classPath = (id: number) => ({ params: { path: { id } } });
const draftPath = (draftId: number) => ({ params: { path: { draftId } } });

export async function getMyCreationBan(): Promise<Ok<"/api/classes/creation-ban">> {
  return unwrapApiResult(await client.GET("/api/classes/creation-ban"), "Failed to load class creation status");
}

export async function listMyClasses(locale: ApiLocale): Promise<OwnClassSummary[]> {
  return unwrapApiResult(
    await client.GET("/api/classes/mine", { params: { query: { locale } } }),
    "Failed to load your classes",
  );
}

export async function getClass(id: number): Promise<SavedClass> {
  return unwrapApiResult(await client.GET("/api/classes/{id}", classPath(id)), "Failed to load the class");
}

export async function getClassDetail(id: number, locale: ApiLocale): Promise<ClassDetail> {
  return unwrapApiResult(
    await client.GET("/api/classes/details/{id}", { params: { path: { id }, query: { locale } } }),
    "Failed to load the class",
  );
}

/** Lists unfinished private creator work, newest first. */
export async function listClassDrafts(): Promise<StoredClassDraft[]> {
  return unwrapApiResult(await client.GET("/api/classes/drafts"), "Failed to load your drafts");
}

export async function getClassDraft(id: number): Promise<StoredClassDraft> {
  return unwrapApiResult(await client.GET("/api/classes/drafts/{draftId}", draftPath(id)), "Failed to load the draft");
}

export async function createClassDraft(input: { classId: number | null; draft: ClassDraft }): Promise<StoredClassDraft> {
  return unwrapApiResult(await client.POST("/api/classes/drafts", { body: input }), "Failed to save the draft");
}

export async function updateClassDraft(input: {
  id: number;
  draft: ClassDraft;
  revision: number;
  force?: boolean;
}): Promise<StoredClassDraft> {
  return unwrapApiResult(
    await client.PUT("/api/classes/drafts/{draftId}", {
      ...draftPath(input.id),
      body: { draft: input.draft, revision: input.revision, force: input.force },
    }),
    "Failed to save the draft",
  );
}

export async function deleteClassDraft(id: number): Promise<void> {
  await unwrapApiResult(await client.DELETE("/api/classes/drafts/{draftId}", draftPath(id)), "Failed to discard the draft");
}

/**
 * Saves a new class, or edits `id` when given. `draftId` names the autosaved draft the save
 * completes; the server discards it.
 */
export async function saveClass(input: { id: number | null; draft: ClassDraft; draftId?: number }): Promise<SavedClassWithRefs> {
  const body = { draft: input.draft, draftId: input.draftId };
  return unwrapApiResult(
    input.id === null
      ? await client.POST("/api/classes", { body })
      : await client.PUT("/api/classes/{id}", { ...classPath(input.id), body }),
    "Failed to save the class",
  );
}

/** Deletes an unused lineage or archives it when existing scvm still need it. */
export async function removeClass(id: number): Promise<{ archived: boolean }> {
  return unwrapApiResult(await client.DELETE("/api/classes/{id}", classPath(id)), "Failed to remove the class");
}

/** Restores a class lineage that the owner previously archived. */
export async function restoreClass(id: number) {
  return unwrapApiResult(await client.POST("/api/classes/{id}/restore", classPath(id)), "Failed to restore the class");
}

/** Publishes a Custom Class after its creator confirms sharing rights. */
export async function publishClass(id: number) {
  return unwrapApiResult(
    await client.POST("/api/classes/{id}/publish", { ...classPath(id), body: { confirmed: true } }),
    "Failed to publish the class",
  );
}

/** Removes a Custom Class from public discovery and other GMs' pools. */
export async function unpublishClass(id: number) {
  return unwrapApiResult(await client.POST("/api/classes/{id}/unpublish", classPath(id)), "Failed to unpublish the class");
}

export async function testRollClass(input: {
  draft: ClassDraft;
  language: ClassLanguage;
  locale: ApiLocale;
}): Promise<CharacterResponse> {
  const scvm = await unwrapApiResult(
    await client.POST("/api/classes/test-roll", {
      params: { query: { locale: input.locale } },
      body: { draft: input.draft, language: input.language },
    }),
    "Failed to roll a test scvm",
  );
  // shortcut: the preview schema marks every field optional while the sheet's Character type doesn't; drop once one derives from the other.
  return scvm as CharacterResponse;
}

export async function disputeClassDecision(input: { id: number; text: string }): Promise<{ id: string }> {
  return unwrapApiResult(
    await client.POST("/api/classes/{id}/disputes", { ...classPath(input.id), body: { text: input.text } }),
    "Failed to submit dispute",
  );
}
