import {
  applyImprovement,
  getOrCreateImprovementPreview,
  rerollImprovementSection,
} from "@/api/characterImprovement";
import type {
  ImprovementDraft,
  ImprovementPreview,
  ImprovementRerollSection,
} from "@/api/characterImprovementTypes";
import { characterKeys } from "@/api";
import type { CharacterResponse } from "@/hooks/models";
import { getCharacterKey } from "@/hooks/utils";
import { useSnackbar } from "@/SnackbarContext/SnackbarProvider";
import { getApiErrorStatus, getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type DraftSection = Exclude<ImprovementRerollSection, "all">;
type SectionDirtyState = Record<DraftSection, boolean>;

function cloneDraft(draft: ImprovementDraft): ImprovementDraft {
  return structuredClone(draft);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

function sectionIsDirty(
  rolledDraft: ImprovementDraft | null,
  workingDraft: ImprovementDraft | null,
  section: DraftSection,
): boolean {
  if (!rolledDraft || !workingDraft) return false;
  return stableStringify(rolledDraft[section]) !== stableStringify(workingDraft[section]);
}

function mergeRerolledSection(
  current: ImprovementDraft,
  rolled: ImprovementDraft,
  section: ImprovementRerollSection,
): ImprovementDraft {
  if (section === "all") {
    return cloneDraft(rolled);
  }

  return {
    ...current,
    snapshot: rolled.snapshot,
    sequence: rolled.sequence,
    [section]: cloneDraft(rolled)[section],
  };
}

export function useGettingBetterPreview(input: {
  characterId: string | null;
  locale?: string;
}) {
  const { characterId, locale } = input;
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useSnackbar();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<ImprovementPreview | null>(null);
  const [workingDraft, setWorkingDraft] = useState<ImprovementDraft | null>(null);
  const [staleConflict, setStaleConflict] = useState(false);

  const dirtySections = useMemo<SectionDirtyState>(() => {
    const rolledDraft = preview?.rolledDraft ?? null;
    return {
      hp: sectionIsDirty(rolledDraft, workingDraft, "hp"),
      debris: sectionIsDirty(rolledDraft, workingDraft, "debris"),
      abilities: sectionIsDirty(rolledDraft, workingDraft, "abilities"),
      scumSpecialties: sectionIsDirty(rolledDraft, workingDraft, "scumSpecialties"),
    };
  }, [preview, workingDraft]);

  const isDirty = Object.values(dirtySections).some(Boolean);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!characterId) throw new Error("Missing character id");
      return getOrCreateImprovementPreview(characterId, locale);
    },
    onSuccess: (nextPreview) => {
      setPreview(nextPreview);
      setWorkingDraft(cloneDraft(nextPreview.rolledDraft));
      setStaleConflict(false);
    },
    onError: (error) => {
      showError(
        getUserFacingApiErrorMessage(
          error,
          t,
          t("gettingBetter.errors.preview", "Failed to roll getting better"),
        ),
      );
    },
  });

  const rerollMutation = useMutation({
    mutationFn: async (section: ImprovementRerollSection) => {
      if (!characterId || !preview) throw new Error("Missing active preview");
      return rerollImprovementSection({
        characterId,
        improvementId: preview.id,
        section,
        locale,
      });
    },
    onSuccess: (nextPreview, section) => {
      setPreview(nextPreview);
      setWorkingDraft((current) =>
        current
          ? mergeRerolledSection(current, nextPreview.rolledDraft, section)
          : cloneDraft(nextPreview.rolledDraft),
      );
      setStaleConflict(false);
    },
    onError: (error) => {
      showError(
        getUserFacingApiErrorMessage(
          error,
          t,
          t("gettingBetter.errors.reroll", "Failed to reroll getting better"),
        ),
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!characterId || !preview || !workingDraft) {
        throw new Error("Missing active preview");
      }
      return applyImprovement({
        characterId,
        improvementId: preview.id,
        draft: workingDraft,
        locale,
      });
    },
    onSuccess: (character: CharacterResponse) => {
      if (character?.id) {
        queryClient.setQueryData(getCharacterKey(character.id, locale), character);
        queryClient.invalidateQueries({ queryKey: characterKeys.list() });
      }
      setPreview(null);
      setWorkingDraft(null);
      setStaleConflict(false);
      setIsOpen(false);
      showSuccess(t("gettingBetter.applied", "Getting better applied"));
    },
    onError: (error) => {
      if (getApiErrorStatus(error) === 409) {
        setStaleConflict(true);
      }
      showError(
        getUserFacingApiErrorMessage(
          error,
          t,
          t("gettingBetter.errors.apply", "Failed to apply getting better"),
        ),
      );
    },
  });

  const open = useCallback(() => {
    setIsOpen(true);
    previewMutation.mutate();
  }, [previewMutation]);

  const close = useCallback(() => {
    if (
      isDirty &&
      !window.confirm(t("gettingBetter.confirmDiscard", "Discard table values?"))
    ) {
      return false;
    }
    setIsOpen(false);
    setWorkingDraft(preview ? cloneDraft(preview.rolledDraft) : null);
    setStaleConflict(false);
    return true;
  }, [isDirty, preview, t]);

  const undoEdits = useCallback(() => {
    if (!preview) return;
    setWorkingDraft(cloneDraft(preview.rolledDraft));
    setStaleConflict(false);
  }, [preview]);

  const rerollSection = useCallback(
    (section: ImprovementRerollSection) => {
      if (!preview) return;
      const sectionDirty =
        section === "all" ? isDirty : dirtySections[section] === true;
      if (
        sectionDirty &&
        !window.confirm(t("gettingBetter.confirmReroll", "Discard local table values?"))
      ) {
        return;
      }
      rerollMutation.mutate(section);
    },
    [dirtySections, isDirty, preview, rerollMutation, t],
  );

  const apply = useCallback(() => {
    applyMutation.mutate();
  }, [applyMutation]);

  return {
    isOpen,
    preview,
    workingDraft,
    dirtySections,
    isDirty,
    staleConflict,
    isLoadingPreview: previewMutation.isPending,
    isRerolling: rerollMutation.isPending,
    isApplying: applyMutation.isPending,
    open,
    close,
    undoEdits,
    rerollSection,
    apply,
    setWorkingDraft,
  };
}

export type GettingBetterPreviewController = ReturnType<
  typeof useGettingBetterPreview
>;
