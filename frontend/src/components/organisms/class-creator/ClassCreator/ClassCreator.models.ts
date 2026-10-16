import type { ClassDraft, StoredClassDraft } from "@/api/classes";

export type ClassCreatorProps = {
  /** The class being edited, or null for a new one. */
  classId: number | null;
  initialDraft: ClassDraft;
  /** Server lifecycle information used to explain a version-forking save. */
  versionInfo?: { version: number; playingCount: number };
  /** A private server autosave to resume, if one exists for this class. */
  initialDraftRecord?: StoredClassDraft | null;
};
