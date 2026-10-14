import { classKeys, deleteClassDraft, getClass, listClassDrafts } from "@/api/classes";
import { CardAction, CenterRow, Spinner } from "@/pages/gmPages.styles";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Button, Stack } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClassCreator } from "../ClassCreator/ClassCreator";
import type { SavedClassCreatorProps } from "./SavedClassCreator.models";

/**
 * Loads one of the GM's classes, then opens it in the creator. An archived or taken-down
 * class can't be edited, and unsaved changes from an earlier visit wait for the GM to
 * resume or discard them.
 */
export function SavedClassCreator({ classId }: SavedClassCreatorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState<"ask" | "resume" | "saved">("ask");
  const classQuery = useQuery({
    queryKey: classKeys.one(classId),
    queryFn: () => getClass(classId),
  });
  const draftsQuery = useQuery({
    queryKey: classKeys.drafts(),
    queryFn: listClassDrafts,
  });
  const discard = useMutation({
    mutationFn: deleteClassDraft,
    onSuccess: () => {
      setChoice("saved");
      void queryClient.invalidateQueries({ queryKey: classKeys.drafts() });
    },
  });

  if (classQuery.error) {
    return (
      <Alert severity="error">
        {getUserFacingApiErrorMessage(classQuery.error, t, "This class wouldn't load.")}
      </Alert>
    );
  }
  if (!classQuery.data || draftsQuery.isLoading) {
    return (
      <CenterRow>
        <Spinner />
      </CenterRow>
    );
  }
  const savedClass = classQuery.data;
  const savedDraft = draftsQuery.data?.find((draft) => draft.classId === classId) ?? null;

  if (savedClass.takenDownAt || savedClass.status === "archived") {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">
          {savedClass.takenDownAt
            ? t(
                "creator.takenDownLocked",
                "This class was taken down by moderation and can't be changed. You can appeal from My classes.",
              )
            : t("creator.archivedLocked", "This class is archived. Restore it on My classes before changing it.")}
          {savedClass.takedownReason && (
            <>
              {" "}
              <strong>{t("creator.takedownReason", "Reason:")}</strong> {savedClass.takedownReason}{" "}
              <Link to="/terms" hash="moderation">
                {t("classes.moderationTerms", "How moderation works")}
              </Link>
            </>
          )}
        </Alert>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <CardAction component={Link} to="/gm/classes">
            {t("creator.backToClasses", "Back to My classes")}
          </CardAction>
          {savedDraft && (
            <Button color="inherit" disabled={discard.isPending} onClick={() => discard.mutate(savedDraft.id)}>
              {t("creator.discardDraft", "Discard unsaved changes")}
            </Button>
          )}
        </Stack>
      </Stack>
    );
  }

  if (savedDraft && choice === "ask") {
    return (
      <Alert
        severity="info"
        action={
          <Stack direction="row" spacing={1}>
            <Button color="inherit" size="small" onClick={() => setChoice("resume")}>
              {t("creator.resumeDraft", "Resume")}
            </Button>
            <Button color="inherit" size="small" disabled={discard.isPending} onClick={() => discard.mutate(savedDraft.id)}>
              {t("creator.discardDraftShort", "Discard")}
            </Button>
          </Stack>
        }
      >
        {t("creator.unsavedChanges", "Unsaved changes from {{date}}. Resume or discard?", {
          date: new Date(savedDraft.updatedAt).toLocaleDateString(),
        })}
        {discard.error && ` ${getUserFacingApiErrorMessage(discard.error, t, t("creator.discardFailed", "The changes weren't discarded. Try again."))}`}
      </Alert>
    );
  }

  const resumed = choice === "resume" ? savedDraft : null;
  return (
    <ClassCreator
      key={`${savedClass.id}:${resumed?.id ?? "saved"}`}
      classId={savedClass.id}
      initialDraft={savedClass.draft}
      initialDraftRecord={resumed}
      versionInfo={{ version: savedClass.version, playingCount: savedClass.playingCount }}
    />
  );
}
