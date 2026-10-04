import { classKeys, saveClass, testRollClass, type ClassDraft, type ClassLanguage } from "@/api/classes";
import { getApiLocale } from "@/hooks/utils";
import type { CreatorIssue, CreatorStep } from "../classCreator.models";
import { abilityIndexOf, draftIssues, itemIndexOf, STEPS, withSavedKeys } from "../classCreator.utils";
import { getApiErrorStatus, getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * The class creator's state: the draft and its revision, the step and language
 * being edited, which fields have been visited, and saving.
 */
export function useClassCreator(classId: number | null, initialDraft: ClassDraft) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(initialDraft);
  const [revision, setRevision] = useState(0);
  const [savedId, setSavedId] = useState(classId);
  const [savedRevision, setSavedRevision] = useState<number | null>(null);
  const [step, setStep] = useState<CreatorStep>("identity");
  const [chosenLanguage, setLanguage] = useState<ClassLanguage>(initialDraft.languages[0]);
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

  const language = draft.languages.includes(chosenLanguage) ? chosenLanguage : draft.languages[0];
  const issues = draftIssues(draft);

  const save = useMutation({
    mutationFn: (input: { draft: ClassDraft; revision: number }) =>
      saveClass({ id: savedId, draft: input.draft }),
    onSuccess: (result, input) => {
      setSavedId(result.id);
      setSavedRevision(input.revision);
      setDraft((current) => withSavedKeys(current, result.draft));
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.setQueryData(classKeys.one(result.id), result);
    },
    onError: (error) =>
      setBlocked(
        getApiErrorStatus(error) === 429
          ? t("creator.saveRateLimited", "You've saved 10 times this minute. Wait a minute, then save again.")
          : getUserFacingApiErrorMessage(error, t, t("creator.saveFailed", "The class didn't save. Try again.")),
      ),
  });

  const testRoll = useMutation({
    mutationFn: async (input: { draft: ClassDraft; language: ClassLanguage; revision: number }) => ({
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
    update: (recipe: (current: ClassDraft) => ClassDraft) => {
      setDraft(recipe);
      setRevision((r) => r + 1);
      setBlocked(null);
    },
    touch: (path: string) => setTouched((current) => (current.has(path) ? current : new Set(current).add(path))),
    showMissing: (path: string) => attempted || step === "review" || touched.has(path),
    setStep,
    setLanguage,
    openAbility,
    setOpenAbility,
    openItem,
    setOpenItem,
    jump,
    /** Steps by `delta` (−1 back, +1 next) when there is one that way. */
    move: (delta: number) => {
      const next = STEPS[STEPS.indexOf(step) + delta];
      if (next) setStep(next);
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
          t("creator.blocked", "Save is blocked: {{count}} things to fix. Each has a Fix button below.", {
            count: issues.length,
          }),
        );
        return;
      }
      setBlocked(null);
      save.mutate({ draft, revision });
    },
  };
}
