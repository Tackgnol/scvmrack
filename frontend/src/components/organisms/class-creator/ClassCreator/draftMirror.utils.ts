import type { ClassDraft } from "@/api/classes";

const PREFIX = "scvmrack-class-draft-unsaved-v1:";

type Mirror = { baseRevision: number; draft: ClassDraft };

/** Keeps the last unsaved edit of a server draft in this browser until a save lands. */
export function writeDraftMirror(draftId: number, baseRevision: number, draft: ClassDraft): void {
  try {
    localStorage.setItem(PREFIX + draftId, JSON.stringify({ baseRevision, draft } satisfies Mirror));
  } catch {
    // storage unavailable or full: the server draft is still the source of truth
  }
}

/** The kept edit, only while the server draft is still at the revision it was made on. */
export function readDraftMirror(draftId: number, serverRevision: number): ClassDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + draftId);
    if (!raw) {
      return null;
    }
    const mirror = JSON.parse(raw) as Mirror;
    return mirror.baseRevision === serverRevision && mirror.draft ? mirror.draft : null;
  } catch {
    return null;
  }
}

export function clearDraftMirror(draftId: number): void {
  try {
    localStorage.removeItem(PREFIX + draftId);
  } catch {
    // nothing to clear
  }
}
