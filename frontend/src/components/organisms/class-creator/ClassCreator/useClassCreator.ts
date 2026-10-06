import {
  classKeys,
  saveClass,
  testRollClass,
  type ClassDraft,
  type ClassLanguage,
} from "@/api/classes";
import { getApiLocale } from "@/hooks/utils";
import { useSnackbar } from "@/SnackbarContext/SnackbarProvider";
import type {
  CreatorChange,
  CreatorIssue,
  CreatorStep,
} from "../classCreator.models";
import {
  abilityIndexOf,
  draftIssues,
  fieldId,
  focusAfterRender,
  itemIndexOf,
  STEPS,
  withSavedKeys,
} from "../classCreator.utils";
import {
  getApiErrorStatus,
  getUserFacingApiErrorMessage,
} from "@/utils/errorUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { readLocalDraftSnapshot, useDraftAutosave } from "./useDraftAutosave";

type HistoryEntry = {
  before: ClassDraft;
  after: ClassDraft;
  label: string;
  source: string | null;
  kind?: CreatorChange["kind"];
  at: number;
};
const HISTORY_LIMIT = 30;
const sameDraft = (left: ClassDraft, right: ClassDraft) =>
  JSON.stringify(left) === JSON.stringify(right);

/**
 * The class creator's state: the draft and its revision, the step and language
 * being edited, which fields have been visited, and saving.
 */
export function useClassCreator(
  classId: number | null,
  initialDraft: ClassDraft,
  initialDraftRecord: import("@/api/classes").StoredClassDraft | null = null,
) {
  const { t, i18n } = useTranslation();
  const { showInfo } = useSnackbar();
  const [localSnapshot] = useState(() =>
    initialDraftRecord ? null : readLocalDraftSnapshot(classId),
  );
  const restoredDraft =
    initialDraftRecord?.draft ?? localSnapshot?.draft ?? initialDraft;
  const restoredRecord =
    initialDraftRecord ?? (localSnapshot?.id ? localSnapshot : null);
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
  const [revision, setRevision] = useState(localSnapshot ? 1 : 0);
  const [savedId, setSavedId] = useState(classId);
  const autosave = useDraftAutosave({
    classId: savedId,
    draft,
    revision,
    initialDraft: restoredRecord,
    replaceDraft,
  });
  const [savedRevision, setSavedRevision] = useState<number | null>(null);
  const [step, setStep] = useState<CreatorStep>("identity");
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
    if (toLanguage) setLanguage(toLanguage);
    const ability = abilityIndexOf(path);
    if (ability !== null) setOpenAbility(ability);
    const item = itemIndexOf(path);
    // The waiting-items tray on Abilities points at items without opening them.
    if (item !== null && to === "items") setOpenItem(item);
  };

  const language = draft.languages.includes(chosenLanguage)
    ? chosenLanguage
    : draft.languages[0];
  const issues = draftIssues(draft);

  const update = (
    recipe: (current: ClassDraft) => ClassDraft,
    change?: CreatorChange,
  ) => {
    const before = draftRef.current;
    const after = recipe(before);
    if (sameDraft(before, after)) return;
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const hintedSource = document.body.dataset.creatorHistorySource;
    const hintedKind = document.body.dataset.creatorHistoryKind as
      | CreatorChange["kind"]
      | undefined;
    const source =
      change?.source ??
      (change?.path
      ? fieldId(change.path)
      : hintedSource || active?.id || null);
    const kind =
      change?.kind ??
      hintedKind ??
      (active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLInputElement &&
        active.getAttribute("role") !== "spinbutton")
        ? "typing"
        : undefined);
    const entry: HistoryEntry = {
      before: structuredClone(before),
      after: structuredClone(after),
      label:
        change?.label ??
        (kind === "typing"
          ? t("creator.history.editedText", "Edited text")
          : t("creator.history.changed", "Changed class")),
      source,
      kind,
      at: Date.now(),
    };
    const last = historyRef.current.undo[historyRef.current.undo.length - 1];
    const coalesce = Boolean(
      last &&
      last.source === source &&
      last.kind === kind &&
        ((kind === "typing" && entry.at - last.at <= 1000) ||
          kind === "nudge" ||
          kind === "move"),
    );
    if (coalesce && last) {
      last.after = entry.after;
      last.at = entry.at;
    } else
      historyRef.current.undo = [
        ...historyRef.current.undo.slice(-(HISTORY_LIMIT - 1)),
        entry,
      ];
    historyRef.current.redo = [];
    draftRef.current = after;
    setDraft(after);
    setRevision((current) => current + 1);
    setBlocked(null);
    publishHistory();
  };
  const restoreFocus = (source: string | null) =>
    requestAnimationFrame(() => {
      const target = source ? document.getElementById(source) : null;
      if (target instanceof HTMLElement) target.focus();
      else focusAfterRender(null);
    });
  const undo = () => {
    const entry = historyRef.current.undo.pop();
    if (!entry) return;
    historyRef.current.redo.push(entry);
    draftRef.current = structuredClone(entry.before);
    setDraft(draftRef.current);
    setRevision((current) => current + 1);
    setBlocked(null);
    publishHistory();
    if (entry.kind !== "move" && entry.kind !== "drag")
      showInfo(
      t("creator.history.undid", "Undid: {{step}}", { step: entry.label }),
      );
    restoreFocus(entry.source);
  };
  const redo = () => {
    const entry = historyRef.current.redo.pop();
    if (!entry) return;
    historyRef.current.undo.push(entry);
    draftRef.current = structuredClone(entry.after);
    setDraft(draftRef.current);
    setRevision((current) => current + 1);
    setBlocked(null);
    publishHistory();
    if (entry.kind !== "move" && entry.kind !== "drag")
      showInfo(
      t("creator.history.redid", "Redid: {{step}}", { step: entry.label }),
      );
    restoreFocus(entry.source);
  };

  const save = useMutation({
    mutationFn: (input: { draft: ClassDraft; revision: number }) =>
      saveClass({ id: savedId, draft: input.draft }),
    onSuccess: (result, input) => {
      setSavedId(result.id);
      setSavedRevision(input.revision);
      setDraft((current) => withSavedKeys(current, result.draft));
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.setQueryData(classKeys.one(result.id), result);
      draftRef.current = withSavedKeys(draftRef.current, result.draft);
      historyRef.current = { undo: [], redo: [] };
      publishHistory();
      void autosave.complete();
    },
    onError: (error) =>
      setBlocked(
        getApiErrorStatus(error) === 429
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
        locale: getApiLocale<ClassLanguage>(i18n.language),
      }),
      revision: input.revision,
    }),
  });

  return {
    draft,
    revision,
    step,
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
    undoLabel: history.undo[history.undo.length - 1]?.label ?? null,
    redoLabel: history.redo[history.redo.length - 1]?.label ?? null,
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
    undoSource: history.undo[history.undo.length - 1]?.source ?? null,
    undoKind: history.undo[history.undo.length - 1]?.kind,
    openItem,
    redoSource: history.redo[history.redo.length - 1]?.source ?? null,
    redoKind: history.redo[history.redo.length - 1]?.kind,
    setOpenItem,
    jump,
    draftAutosave: autosave,
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
      save.mutate({ draft, revision });
    },
  };
}
