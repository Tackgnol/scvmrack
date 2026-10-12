import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useEffect, useRef, useState } from "react";
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
} from "../classCreator.models";
import { Hint, SmallAction } from "../classCreator.styles";
import { focusAfterRender, STEP_TITLE_ID, STEPS } from "../classCreator.utils";
import { isEditable, isMac, reorderableCount } from "./ClassCreator.utils";
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
  const creator = useClassCreator(classId, initialDraft, initialDraftRecord);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const discardDraft = () => {
    setDiscarding(true);
    void creator.draftAutosave.discard()
      .then(() => setConfirmDiscard(false))
      .catch(() => showError(t("creator.draftDiscardFailed", "The draft couldn't be discarded. Try again.")))
      .finally(() => setDiscarding(false));
  };
  const moveRef = useRef(creator.move);
  useEffect(() => {
    moveRef.current = creator.move;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isEditable(event.target)) {
        if (creator.openAbility !== null) {
          event.preventDefault();
          creator.setOpenAbility(null);
          focusAfterRender(`abilities.${creator.openAbility}`);
        } else if (creator.openItem !== null) {
          event.preventDefault();
          creator.setOpenItem(null);
          focusAfterRender(`items.${creator.openItem}`);
        }
        return;
      }
      const modifier = event.ctrlKey || event.metaKey;
      const redo =
        event.key.toLowerCase() === "y" ||
        (event.key.toLowerCase() === "z" && event.shiftKey);
      const undo = event.key.toLowerCase() === "z" && !event.shiftKey;
      const fieldHistory = redo
        ? { source: creator.redoSource, kind: creator.redoKind }
        : { source: creator.undoSource, kind: creator.undoKind };
      const ownCreatorEdit =
        event.target instanceof HTMLElement &&
        event.target.id === fieldHistory.source &&
        (fieldHistory.kind === "nudge" || fieldHistory.kind === "paste");
      if (
        !modifier ||
        (!undo && !redo) ||
        (isEditable(event.target) && !ownCreatorEdit)
      )
        return;
      event.preventDefault();
      if (redo) creator.redo();
      else creator.undo();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [
    creator,
    creator.redoKind,
    creator.redoSource,
    creator.undoKind,
    creator.undoSource,
  ]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!creator.canUndo || creator.saved) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [creator.canUndo, creator.saved]);
  const index = STEPS.indexOf(creator.step);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  useEffect(() => {
    // Alt+←/→ moves between steps and must never reach the browser's Back/Forward.
    const onKey = (event: KeyboardEvent) => {
      if (
        !event.altKey ||
        (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
      )
        return;
      // On macOS Option+arrow jumps words in a text field and never navigates; leave it be.
      if (isMac() && isEditable(event.target)) return;
      event.preventDefault();
      if (moveRef.current(event.key === "ArrowLeft" ? -1 : 1))
        focusAfterRender(null);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

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
              {creator.issues.length > 0 &&
                ` · ${creator.attempted
                  ? t("creator.toFix", "{{count}} to fix", { count: creator.issues.length })
                  : t("creator.toDo", "{{count}} to do", { count: creator.issues.length })}`}
            </StepCount>
            {creator.draftAutosave.state !== "idle" && (
              <DraftStatus data-testid="draft-save-state" role="status">
                {creator.draftAutosave.state === "saving" &&
                  t("creator.draftSaving", "Saving…")}
                {creator.draftAutosave.state === "saved" &&
                  t(
                    "creator.draftSaved",
                    "Draft saved · kept 90 days after your last edit",
                  )}
                {creator.draftAutosave.state === "offline" &&
                  t("creator.draftOffline", "Offline, will retry")}
                {creator.draftAutosave.state === "conflict" &&
                  t("creator.draftConflict", "Draft changed elsewhere")}
                {creator.draftAutosave.state === "banned" &&
                  t("creator.draftBanned", "New class creation restricted")}
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
                {creator.undoLabel
                  ? t("creator.history.undo", "Undo {{step}}", {
                      step: creator.undoLabel,
                    })
                  : t("creator.history.undo", "Undo")}
              </SmallAction>
              <SmallAction
                type="button"
                disabled={!creator.canRedo}
                aria-keyshortcuts="Control+Shift+Z Control+Y Meta+Shift+Z Meta+Y"
                onClick={creator.redo}
              >
                {creator.redoLabel
                  ? t("creator.history.redo", "Redo {{step}}", {
                      step: creator.redoLabel,
                    })
                  : t("creator.history.redo", "Redo")}
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
          <BackButton
            type="button"
            disabled={!previous}
            aria-keyshortcuts="Alt+ArrowLeft"
            onClick={() => previous && goTo(previous)}
          >
            <ArrowBackIcon aria-hidden="true" />
            {previous
              ? t(`creator.steps.${previous}.label`)
              : t("creator.back", "Back")}
          </BackButton>
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
            <ModalButton variant="danger" disabled={discarding} onClick={discardDraft}>
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
