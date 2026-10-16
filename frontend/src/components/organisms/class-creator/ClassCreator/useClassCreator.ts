import {
  classKeys,
  saveClass,
  testRollClass,
  type ClassDraft,
  type ClassLanguage,
  type StoredClassDraft,
} from "@/api/classes";
import { getApiLocale } from "@/hooks/utils";
import type { CreatorIssue, CreatorStep } from "../creatorShared.models";
import {
  abilityIndexOf,
  blankDraft,
  draftIssues,
  itemIndexOf,
  STEPS,
  withSavedKeys,
} from "../creatorShared.utils";
import {
  getApiErrorCode,
  getApiErrorStatus,
  getUserFacingApiErrorMessage,
} from "@/utils/errorUtils";
import { hashKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDraftAutosave } from "./useDraftAutosave";

type HistoryEntry = { before: ClassDraft; after: ClassDraft; at: number; control: string | null };
const HISTORY_LIMIT = 30;
/**
 * Edits to the same control closer together than this undo as one step, so typing and
 * nudging aren't undone a keystroke at a time.
 */
const MERGE_MS = 1000;
const sameDraft = (left: ClassDraft, right: ClassDraft) =>
  JSON.stringify(left) === JSON.stringify(right);

/**
 * The class creator's state: the draft and its revision, the step and language
 * being edited, which fields have been visited, and saving.
 */
export function useClassCreator(
  classId: number | null,
  initialDraft: ClassDraft,
  initialDraftRecord: StoredClassDraft | null = null,
) {
  const { t, i18n } = useTranslation();
  const restoredDraft = initialDraftRecord?.draft ?? initialDraft;
  const draftRef = useRef(restoredDraft);
  const historyRef = useRef<{ undo: HistoryEntry[]; redo: HistoryEntry[] }>({
    undo: [],
    redo: [],
  });
  const [history, setHistory] = useState(historyRef.current);
  const publishHistory = () =>
    setHistory({
      undo: [...historyRef.current.undo],
      redo: [...historyRef.current.redo],
    });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(restoredDraft);
  const replaceDraft = (nextDraft: ClassDraft) => {
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  };
  const [revision, setRevision] = useState(0);
  const [savedId, setSavedId] = useState(classId);
  const autosave = useDraftAutosave({
    classId: savedId,
    draft,
    revision,
    initialDraft: initialDraftRecord,
    replaceDraft,
  });
  const [savedRevision, setSavedRevision] = useState<number | null>(null);
  const [step, setCurrentStep] = useState<CreatorStep>("identity");
  /** Steps the GM has left at least once; only their problems count as failures in the rail. */
  const [visited, setVisited] = useState<ReadonlySet<CreatorStep>>(() => new Set());
  const setStep = (next: CreatorStep) => {
    setVisited((current) => (current.has(step) ? current : new Set(current).add(step)));
    setCurrentStep(next);
  };
  const [chosenLanguage, setLanguage] = useState<ClassLanguage>(
    restoredDraft.languages[0],
  );
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [attempted, setAttempted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  /** The one ability card that is open, by position. */
  const [openAbility, setOpenAbility] = useState<number | null>(null);
  /** The one Class Item card that is open, by position. */
  const [openItem, setOpenItem] = useState<number | null>(null);
  const jump = (to: CreatorStep, path: string, toLanguage?: ClassLanguage) => {
    setStep(to);
    if (toLanguage) {
      setLanguage(toLanguage);
    }
    const ability = abilityIndexOf(path);
    if (ability !== null) {
      setOpenAbility(ability);
    }
    const item = itemIndexOf(path);
    // The waiting-items tray on Abilities points at items without opening them.
    if (item !== null && to === "items") {
      setOpenItem(item);
    }
  };

  const language = draft.languages.includes(chosenLanguage)
    ? chosenLanguage
    : draft.languages[0];
  const issues = draftIssues(draft);

  const update = (recipe: (current: ClassDraft) => ClassDraft) => {
    const before = draftRef.current;
    const after = recipe(before);
    if (sameDraft(before, after)) {
      return;
    }
    const focused = document.activeElement;
    const entry: HistoryEntry = {
      before: structuredClone(before),
      after: structuredClone(after),
      at: Date.now(),
      control: focused instanceof HTMLElement && focused.id ? focused.id : null,
    };
    const last = historyRef.current.undo[historyRef.current.undo.length - 1];
    if (last && entry.control !== null && last.control === entry.control && entry.at - last.at <= MERGE_MS) {
      last.after = entry.after;
      last.at = entry.at;
    } else {
      historyRef.current.undo = [
        ...historyRef.current.undo.slice(-(HISTORY_LIMIT - 1)),
        entry,
      ];
    }
    historyRef.current.redo = [];
    draftRef.current = after;
    setDraft(after);
    setRevision((current) => current + 1);
    setBlocked(null);
    publishHistory();
  };
  const undo = () => {
    const entry = historyRef.current.undo.pop();
    if (!entry) {
      return;
    }
    historyRef.current.redo.push(entry);
    draftRef.current = structuredClone(entry.before);
    setDraft(draftRef.current);
    setRevision((current) => current + 1);
    setBlocked(null);
    publishHistory();
  };
  const redo = () => {
    const entry = historyRef.current.redo.pop();
    if (!entry) {
      return;
    }
    historyRef.current.undo.push(entry);
    draftRef.current = structuredClone(entry.after);
    setDraft(draftRef.current);
    setRevision((current) => current + 1);
    setBlocked(null);
    publishHistory();
  };

  const save = useMutation({
    mutationFn: (input: { draft: ClassDraft; revision: number; draftId?: number }) =>
      saveClass({ id: savedId, draft: input.draft, draftId: input.draftId }),
    onSuccess: (result, input) => {
      setSavedId(result.id);
      setSavedRevision(input.revision);
      setDraft((current) => withSavedKeys(current, result.draft, result.savedRefs));
      // Saving consumes the draft server-side; refetching it would only 404.
      const consumedDraft = input.draftId === undefined ? null : hashKey(classKeys.draft(input.draftId));
      void queryClient.invalidateQueries({
        queryKey: classKeys.all(),
        predicate: (query) => query.queryHash !== consumedDraft,
      });
      queryClient.setQueryData(classKeys.one(result.id), result);
      draftRef.current = withSavedKeys(draftRef.current, result.draft, result.savedRefs);
      historyRef.current = { undo: [], redo: [] };
      publishHistory();
      autosave.complete(input.draftId);
    },
    onError: (error) =>
      setBlocked(
        getApiErrorCode(error) === "CLASS_CREATION_BANNED"
          ? t("creator.creationBanned", "You cannot create new Custom Classes while a moderation restriction is active. Your existing classes remain available.")
          : getApiErrorStatus(error) === 429
          ? t(
              "creator.saveRateLimited",
              "You've saved 10 times this minute. Wait a minute, then save again.",
            )
          : getUserFacingApiErrorMessage(
              error,
              t,
              t("creator.saveFailed", "The class didn't save. Try again."),
            ),
      ),
  });

  const testRoll = useMutation({
    mutationFn: async (input: {
      draft: ClassDraft;
      language: ClassLanguage;
      revision: number;
    }) => ({
      scvm: await testRollClass({
        draft: input.draft,
        language: input.language,
        locale: getApiLocale(i18n.language),
      }),
      revision: input.revision,
    }),
  });

  const discard = async () => {
    await autosave.discard();
    const resetDraft = classId === null ? blankDraft() : initialDraft;
    replaceDraft(resetDraft);
    historyRef.current = { undo: [], redo: [] };
    publishHistory();
    setCurrentStep("identity");
    setVisited(new Set());
    setLanguage(resetDraft.languages[0]);
    setTouched(new Set());
    setAttempted(false);
    setBlocked(null);
    setOpenAbility(null);
    setOpenItem(null);
    setSavedRevision(null);
    testRoll.reset();
  };

  return {
    draft,
    revision,
    step,
    visited,
    attempted,
    language,
    issues,
    blocked,
    saving: save.isPending,
    saved: savedRevision === revision,
    testRoll: {
      scvm: testRoll.data?.scvm ?? null,
      stale: testRoll.data !== undefined && testRoll.data.revision !== revision,
      rolling: testRoll.isPending,
      error: testRoll.error,
      roll: () => testRoll.mutate({ draft, language, revision }),
    },
    update,
    undo,
    redo,
    canUndo: history.undo.length > 0,
    canRedo: history.redo.length > 0,
    touch: (path: string) =>
      setTouched((current) =>
        current.has(path) ? current : new Set(current).add(path),
      ),
    showMissing: (path: string) =>
      attempted || step === "review" || touched.has(path),
    setStep: (nextStep: CreatorStep) => {
      setStep(nextStep);
      void autosave.persist();
    },
    setLanguage,
    openAbility,
    setOpenAbility,
    openItem,
    setOpenItem,
    jump,
    draftAutosave: { ...autosave, discard },
    /** Steps by `delta` (−1 back, +1 next) when there is one that way. */
    move: (delta: number) => {
      const next = STEPS[STEPS.indexOf(step) + delta];
      if (next) {
        setStep(next);
        void autosave.persist();
      }
      return next;
    },
    fix: (issue: CreatorIssue) => {
      setAttempted(true);
      jump(issue.step, issue.path, issue.language);
    },
    save: () => {
      setAttempted(true);
      if (issues.length > 0) {
        setBlocked(
          t(
            "creator.blocked",
            "Save is blocked: {{count}} things to fix. Each has a Fix button below.",
            {
              count: issues.length,
            },
          ),
        );
        return;
      }
      setBlocked(null);
      save.mutate({ draft, revision, draftId: autosave.record?.id });
    },
  };
}
