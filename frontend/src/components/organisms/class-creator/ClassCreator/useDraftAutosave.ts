import {
  classKeys,
  createClassDraft,
  deleteClassDraft,
  getClassDraft,
  updateClassDraft,
  type ClassDraft,
  type StoredClassDraft,
} from "@/api/classes";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorCode, getApiErrorStatus } from "@/utils/errorUtils";
import { useCallback, useEffect, useRef, useState } from "react";

export type DraftSaveState = "idle" | "saving" | "saved" | "offline" | "conflict" | "banned" | "limit" | "unsaved";

type UseDraftAutosaveInput = {
  classId: number | null;
  draft: ClassDraft;
  revision: number;
  initialDraft: StoredClassDraft | null;
  replaceDraft: (draft: ClassDraft) => void;
};

const RETRY_MS = 5_000;

const isClientError = (error: unknown) => {
  const status = getApiErrorStatus(error);
  return status !== undefined && status >= 400 && status < 500;
};

type PersistAttempt =
  | { saved: StoredClassDraft; error: null }
  | { saved: null; error: unknown };

async function requestPersist(
  previous: StoredClassDraft | null,
  classId: number | null,
  draft: ClassDraft,
  force: boolean,
): Promise<PersistAttempt> {
  try {
    const saved = previous
      ? await updateClassDraft({ id: previous.id, draft, revision: previous.revision, force })
      : await createClassDraft({ classId, draft });
    return { saved, error: null };
  } catch (error) {
    return { saved: null, error };
  }
}
/** Keeps a private server draft in sync after an idle second, retrying while offline. */
export function useDraftAutosave({ classId, draft, revision, initialDraft, replaceDraft }: UseDraftAutosaveInput) {
  const queryClient = useQueryClient();
  const [record, setRecord] = useState<StoredClassDraft | null>(initialDraft);
  const [state, setState] = useState<DraftSaveState>(initialDraft ? "saved" : "idle");
  const latest = useRef({ draft, revision });
  const recordRef = useRef(record);
  const saving = useRef(false);
  const pendingWrite = useRef<Promise<PersistAttempt> | null>(null);
  const discarding = useRef(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const replaceDraftRef = useRef(replaceDraft);
  const conflict = useRef(false);
  // revision the class was last saved at; nothing to autosave until the GM edits again
  const completedRevision = useRef<number | null>(null);
  // last editor revision the server holds; a re-render after a save must not write it again
  const savedRevision = useRef(0);

  useEffect(() => {
    latest.current = { draft, revision };
  }, [draft, revision]);
  useEffect(() => {
    recordRef.current = record;
  }, [record]);
  useEffect(() => {
    replaceDraftRef.current = replaceDraft;
  }, [replaceDraft]);
  const deleteDraft = useCallback(async (id: number) => {
    await deleteClassDraft(id);
    await queryClient.invalidateQueries({ queryKey: classKeys.drafts(), exact: true });
  }, [queryClient]);
  const persist = useCallback(async (force = false) => {
    if (saving.current || discarding.current || latest.current.revision === 0 || conflict.current) {
      return;
    }
    if (completedRevision.current !== null && latest.current.revision <= completedRevision.current) {
      return;
    }
    if (!force && latest.current.revision === savedRevision.current) {
      return;
    }
    saving.current = true;
    setState("saving");
    const snapshot = latest.current;
    const previous = recordRef.current;
    const write = requestPersist(previous, classId, snapshot.draft, force);
    pendingWrite.current = write;
    const result = await write;
    pendingWrite.current = null;
    if (completedRevision.current !== null && completedRevision.current >= snapshot.revision) {
      // A save or discard finished during this write; ignore the obsolete revision.
      if (result.saved && !discarding.current) {
        await deleteDraft(result.saved.id).catch(() => undefined);
      }
      saving.current = false;
      setState("idle");
      return;
    }
    if (result.saved) {
      savedRevision.current = snapshot.revision;
      recordRef.current = result.saved;
      setRecord(result.saved);
      setState("saved");
    } else if (getApiErrorCode(result.error) === "DRAFT_STALE") {
      conflict.current = true;
      setState("conflict");
    } else if (getApiErrorCode(result.error) === "CLASS_CREATION_BANNED") {
      setState("banned");
    } else if (getApiErrorCode(result.error) === "DRAFT_LIMIT_REACHED") {
      setState("limit");
    } else if (isClientError(result.error)) {
      // Retrying a refused request (including a 429) can't succeed; the next edit tries again.
      setState("unsaved");
    } else {
      setState("offline");
      setRetryAttempt((attempt) => attempt + 1);
    }
    saving.current = false;
    if (latest.current.revision !== snapshot.revision && !conflict.current) {
      void persist();
    }
  }, [classId, deleteDraft]);

  useEffect(() => {
    if (revision === 0 || (completedRevision.current !== null && revision <= completedRevision.current)) {
      return;
    }
    const timer = window.setTimeout(() => void persist(), 1_000);
    return () => window.clearTimeout(timer);
  }, [draft, persist, revision]);

  useEffect(() => {
    if (state !== "offline") {
      return;
    }
    const timer = window.setTimeout(() => void persist(), RETRY_MS);
    return () => window.clearTimeout(timer);
  }, [persist, retryAttempt, state]);

  useEffect(() => () => {
    // Refresh after the flush settles, without reopening the editor's own draft prompt.
    void persist().then(function refreshDraftList(): Promise<void> {
      const pending = pendingWrite.current;
      if (pending) {
        return pending.then(refreshDraftList);
      }
      return queryClient.invalidateQueries({ queryKey: classKeys.drafts(), exact: true });
    });
  }, [persist, queryClient]);

  const loadNewer = useCallback(async () => {
    if (!recordRef.current) {
      return;
    }
    const newer = await getClassDraft(recordRef.current.id);
    recordRef.current = newer;
    setRecord(newer);
    replaceDraftRef.current(newer.draft);
    conflict.current = false;
    setState("saved");
  }, []);

  const keepMine = useCallback(async () => {
    conflict.current = false;
    await persist(true);
  }, [persist]);

  const discard = useCallback(() => {
    const previousCompleted = completedRevision.current;
    completedRevision.current = latest.current.revision;
    discarding.current = true;
    let savedDuringDiscard: StoredClassDraft | null = null;
    return Promise.resolve(pendingWrite.current)
      .then((result) => {
        savedDuringDiscard = result?.saved ?? null;
        const toDelete = savedDuringDiscard ?? recordRef.current;
        return toDelete ? deleteDraft(toDelete.id) : Promise.resolve();
      })
      .then(() => {
        recordRef.current = null;
        setRecord(null);
        setState("idle");
      })
      .catch((error: unknown) => {
        completedRevision.current = previousCompleted;
        if (savedDuringDiscard) {
          recordRef.current = savedDuringDiscard;
          setRecord(savedDuringDiscard);
          savedRevision.current = latest.current.revision;
          setState("saved");
        }
        throw error;
      })
      .finally(() => { discarding.current = false; });
  }, [deleteDraft]);

  /**
   * Forgets the draft after a save. The server discarded `discardedId` with the save; a record
   * the save didn't name (its first autosave was still in flight) is deleted here.
   */
  const complete = useCallback((discardedId?: number) => {
    completedRevision.current = latest.current.revision;
    const leftover = recordRef.current;
    if (leftover && leftover.id !== discardedId) {
      void deleteDraft(leftover.id).catch(() => undefined);
    }
    recordRef.current = null;
    setRecord(null);
    setState("idle");
  }, [deleteDraft]);

  return { state, record, persist, loadNewer, keepMine, discard, complete };
}
