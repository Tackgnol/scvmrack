import type { ClassDraft, StoredClassDraft } from "@/api/classes";

export type ClassCreatorProps = {
  /** The class being edited, or null for a new one. */
  classId: number | null;
  initialDraft: ClassDraft;
  /** A private server autosave to resume, if one exists for this class. */
  initialDraftRecord?: StoredClassDraft | null;
};
