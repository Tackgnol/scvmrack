import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Alert } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classKeys } from "@/api/classes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "@/SnackbarContext/SnackbarProvider";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { AbilitiesStep } from "../AbilitiesStep/AbilitiesStep";
import { ItemsStep } from "../ItemsStep/ItemsStep";
import { CreatorRail } from "../CreatorRail/CreatorRail";
import { GettingBetterStep } from "../GettingBetterStep/GettingBetterStep";
import { IdentityStep } from "../IdentityStep/IdentityStep";
import { OriginsStep } from "../OriginsStep/OriginsStep";
import { ReviewStep } from "../ReviewStep/ReviewStep";
import { StatsStep } from "../StatsStep/StatsStep";
import { WritingInSwitch } from "../WritingInSwitch/WritingInSwitch";
import type {
  CreatorIssue,
  CreatorStep,
  StepProps,
} from "../creatorShared.models";
import { Hint, SmallAction } from "../creatorShared.styles";
import { focusAfterRender, STEP_TITLE_ID, STEPS } from "../creatorShared.utils";
import { reorderableCount } from "./ClassCreator.utils";
import { useCreatorShortcuts } from "./useCreatorShortcuts";
import type { ClassCreatorProps } from "./ClassCreator.models";
import {
  BackButton,
  ConflictAction,
  ConflictPanel,
  DiscardDraft,
  DraftStatus,
  Head,
  History,
  Layout,
  Nav,
  NextButton,
  Paper,
  PaperFoot,
  ShortcutHint,
  StepCount,
  StepTitle,
} from "./ClassCreator.styles";
import { useClassCreator } from "./useClassCreator";

/** The class creator: steps in a rail, one language at a time, a test roll and a save. */
export function ClassCreator({
  classId,
  initialDraft,
  initialDraftRecord = null,
  versionInfo,
}: ClassCreatorProps) {
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const queryClient = useQueryClient();
  const creator = useClassCreator(classId, initialDraft, initialDraftRecord);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const discard = useMutation({
    mutationFn: creator.draftAutosave.discard,
    onSuccess: () => {
      setConfirmDiscard(false);
      void queryClient.invalidateQueries({ queryKey: classKeys.drafts() });
    },
    onError: () => showError(t("creator.draftDiscardFailed", "The draft couldn't be discarded. Try again.")),
  });
  useCreatorShortcuts(creator);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!creator.canUndo || creator.saved) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [creator.canUndo, creator.saved]);
  const index = STEPS.indexOf(creator.step);
  const stepIssues = creator.step === "review"
    ? creator.issues.length
    : creator.issues.filter((issue) => issue.step === creator.step).length;
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];


  const goTo = (step: CreatorStep) => {
    creator.setStep(step);
    focusAfterRender(null);
  };
  const fix = (issue: CreatorIssue) => {
    creator.fix(issue);
    focusAfterRender(issue.path);
  };
  const stepProps: StepProps = {
    draft: creator.draft,
    language: creator.language,
    update: creator.update,
    showMissing: creator.showMissing,
    touch: creator.touch,
    focus: focusAfterRender,
    jump: (step, path) => {
      creator.jump(step, path);
      focusAfterRender(path);
    },
  };
  const quiet = creator.blocked !== null;
  const versionWarning =
    !creator.saved && versionInfo && versionInfo.playingCount > 0
      ? t(
          "creator.review.versionWarning",
          "{{count}} scvm play version {{version}}. Saving creates version {{nextVersion}}: they keep version {{version}}; new rolls use version {{nextVersion}}.",
          {
            count: versionInfo.playingCount,
            version: versionInfo.version,
            nextVersion: versionInfo.version + 1,
          },
        )
      : null;

  return (
    <Layout>
      <CreatorRail
        current={creator.step}
        issues={creator.issues}
        quiet={quiet}
        noItems={creator.draft.items.length === 0}
        noAbilities={creator.draft.abilities.length === 0}
        visited={creator.visited}
        attempted={creator.attempted}
        onStep={goTo}
      />
      <section aria-labelledby={STEP_TITLE_ID}>
        <Head>
          <div>
            <StepTitle key={creator.step} id={STEP_TITLE_ID} tabIndex={-1}>
              {t(`creator.steps.${creator.step}.label`)}
            </StepTitle>
            <StepCount>
              {t("creator.stepCount", "Step {{n}} of {{total}}", {
                n: index + 1,
                total: STEPS.length,
              })}
              {stepIssues > 0 &&
                ` · ${creator.attempted || creator.visited.has(creator.step)
                  ? t("creator.toFix", "{{count}} to fix", { count: stepIssues })
                  : t("creator.toDo", "{{count}} to do", { count: stepIssues })}`}
            </StepCount>
            {(creator.draftAutosave.state !== "idle" || creator.draftAutosave.record) && (
              <DraftStatus data-testid="draft-save-state" role="status">
                {creator.draftAutosave.state === "saving" &&
                  t("creator.draftSaving", "Saving…")}
                {creator.draftAutosave.state === "saved" &&
                  creator.draftAutosave.record &&
                  t("creator.draftSaved", "Draft saved · kept until {{date}} unless you edit it again", {
                    date: new Date(creator.draftAutosave.record.expiresAt).toLocaleDateString(),
                  })}
                {creator.draftAutosave.state === "offline" &&
                  t("creator.draftOffline", "Offline, will retry")}
                {creator.draftAutosave.state === "conflict" &&
                  t("creator.draftConflict", "Draft changed elsewhere")}
                {creator.draftAutosave.state === "banned" &&
                  t("creator.draftBanned", "New class creation restricted")}
                {creator.draftAutosave.state === "limit" &&
                  t("creator.draftLimit", "Not saved as a draft: you already keep 3 unfinished new classes. Save this class or discard a draft.")}
                {creator.draftAutosave.state === "unsaved" &&
                  t("creator.draftUnsaved", "Draft not saved. Your next edit tries again.")}
                {creator.draftAutosave.record &&
                  creator.draftAutosave.state !== "conflict" && (
                    <DiscardDraft
                      type="button"
                      onClick={() => setConfirmDiscard(true)}
                    >
                      {t("creator.draftDiscard", "Discard")}
                    </DiscardDraft>
                  )}
              </DraftStatus>
            )}
          </div>
          {creator.step !== "stats" && (
            <WritingInSwitch
              languages={creator.draft.languages}
              value={creator.language}
              step={creator.step}
              issues={creator.issues}
              quiet={quiet}
              onChange={creator.setLanguage}
            />
          )}
        </Head>
        {creator.draftAutosave.state === "conflict" && (
          <ConflictPanel role="alert">
            <strong>{t("creator.draftConflictTitle", "Draft conflict")}</strong>
            <p>{t("creator.draftConflictBody", "This draft changed on another device. Choose which version to keep.")}</p>
            <div className="choices">
              <div>
                <ConflictAction type="button" onClick={() => void creator.draftAutosave.loadNewer()}>
                  {t("creator.draftLoadNewer", "Load newer one")}
                </ConflictAction>
                <p>{t("creator.draftLoadNewerLoss", "Your edits here since the last save will be lost.")}</p>
              </div>
              <div>
                <ConflictAction type="button" onClick={() => void creator.draftAutosave.keepMine()}>
                  {t("creator.draftKeepMine", "Keep mine")}
                </ConflictAction>
                <p>{t("creator.draftKeepMineLoss", "This overwrites the newer draft from the other device.")}</p>
              </div>
            </div>
          </ConflictPanel>
        )}
        {versionWarning && creator.step !== "review" && (
          <Alert severity="info">{versionWarning}</Alert>
        )}
        <Paper>
          <Hint>{t(`creator.steps.${creator.step}.hint`)}</Hint>
          {creator.step === "identity" && <IdentityStep {...stepProps} />}
          {creator.step === "stats" && <StatsStep {...stepProps} />}
          {creator.step === "items" && (
            <ItemsStep
              {...stepProps}
              issues={creator.issues}
              openItem={creator.openItem}
              onOpenItem={creator.setOpenItem}
            />
          )}
          {creator.step === "abilities" && (
            <AbilitiesStep
              {...stepProps}
              issues={creator.issues}
              openAbility={creator.openAbility}
              onOpenAbility={creator.setOpenAbility}
            />
          )}
          {creator.step === "origins" && <OriginsStep {...stepProps} />}
          {creator.step === "gettingBetter" && (
            <GettingBetterStep {...stepProps} />
          )}
          {creator.step === "review" && (
            <ReviewStep
              draft={creator.draft}
              language={creator.language}
              testRoll={creator.testRoll}
              issues={creator.issues}
              onFix={fix}
              saving={creator.saving}
              saved={creator.saved}
              versionWarning={versionWarning}
              blocked={creator.blocked}
              onSave={creator.save}
            />
          )}
          <PaperFoot>
            <History
              role="group"
              aria-label={t("creator.history.label", "Edit history")}
            >
              <SmallAction
                type="button"
                disabled={!creator.canUndo}
                aria-keyshortcuts="Control+Z Meta+Z"
                onClick={creator.undo}
              >
                {t("creator.history.undo", "Undo")}
              </SmallAction>
              <SmallAction
                type="button"
                disabled={!creator.canRedo}
                aria-keyshortcuts="Control+Shift+Z Control+Y Meta+Shift+Z Meta+Y"
                onClick={creator.redo}
              >
                {t("creator.history.redo", "Redo")}
              </SmallAction>
            </History>
            {reorderableCount(creator.draft, creator.step) > 1 && (
              <ShortcutHint>
                {t("creator.reorder.shortcut", "Alt+↑/↓ moves the focused card or table row.")}
              </ShortcutHint>
            )}
          </PaperFoot>
        </Paper>
        <Nav>
          {previous && (
            <BackButton
              type="button"
              aria-keyshortcuts="Alt+ArrowLeft"
              onClick={() => goTo(previous)}
            >
              <ArrowBackIcon aria-hidden="true" />
              {t(`creator.steps.${previous}.label`)}
            </BackButton>
          )}
          {next && (
            <NextButton
              type="button"
              aria-keyshortcuts="Alt+ArrowRight"
              onClick={() => goTo(next)}
            >
              {t(`creator.steps.${next}.label`)}
              <ArrowForwardIcon aria-hidden="true" />
            </NextButton>
          )}
        </Nav>
      </section>
      <MorkBorgModal
        role="alertdialog"
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title={t("creator.draftDiscardConfirm", "Discard this unfinished draft?")}
        maxWidth="xs"
        actions={
          <>
            <ModalButton variant="secondary" onClick={() => setConfirmDiscard(false)}>
              {t("actions.cancel", "Cancel")}
            </ModalButton>
            <ModalButton variant="danger" disabled={discard.isPending} onClick={() => discard.mutate()}>
              {t("creator.draftDiscard", "Discard")}
            </ModalButton>
          </>
        }
      >
        <p>
          {creator.draft.name[creator.language].trim()
            ? t("classes.discardLoss", "“{{name}}” will be permanently deleted.", { name: creator.draft.name[creator.language].trim() })
            : t("creator.draftDiscardLoss", "This unfinished draft will be permanently deleted.")}
        </p>
      </MorkBorgModal>
    </Layout>
  );
}
