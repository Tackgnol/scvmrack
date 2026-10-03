import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CreatorRail } from "../CreatorRail/CreatorRail";
import { GettingBetterStep } from "../GettingBetterStep/GettingBetterStep";
import { IdentityStep } from "../IdentityStep/IdentityStep";
import { OriginsStep } from "../OriginsStep/OriginsStep";
import { ReviewStep } from "../ReviewStep/ReviewStep";
import { StatsStep } from "../StatsStep/StatsStep";
import { WritingInSwitch } from "../WritingInSwitch/WritingInSwitch";
import type { CreatorIssue, CreatorStep, StepProps } from "../classCreator.models";
import { Hint } from "../classCreator.styles";
import { focusAfterRender, STEP_TITLE_ID, STEPS } from "../classCreator.utils";
import { isEditable, isMac } from "./ClassCreator.utils";
import type { ClassCreatorProps } from "./ClassCreator.models";
import { BackButton, Head, Layout, Nav, NextButton, Paper, StepCount, StepTitle } from "./ClassCreator.styles";
import { useClassCreator } from "./useClassCreator";

/** The class creator: steps in a rail, one language at a time, a test roll and a save. */
export function ClassCreator({ classId, initialDraft }: ClassCreatorProps) {
  const { t } = useTranslation();
  const creator = useClassCreator(classId, initialDraft);
  const moveRef = useRef(creator.move);
  useEffect(() => {
    moveRef.current = creator.move;
  });
  const index = STEPS.indexOf(creator.step);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];

  useEffect(() => {
    // Alt+←/→ moves between steps and must never reach the browser's Back/Forward.
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      // On macOS Option+arrow jumps words in a text field and never navigates; leave it be.
      if (isMac() && isEditable(event.target)) return;
      event.preventDefault();
      if (moveRef.current(event.key === "ArrowLeft" ? -1 : 1)) focusAfterRender(null);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
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
  };
  const quiet = creator.blocked !== null;

  return (
    <Layout>
      <CreatorRail current={creator.step} issues={creator.issues} quiet={quiet} onStep={goTo} />
      <section aria-labelledby={STEP_TITLE_ID}>
        <Head>
          <div>
            <StepTitle key={creator.step} id={STEP_TITLE_ID} tabIndex={-1}>
              {t(`creator.steps.${creator.step}.label`)}
            </StepTitle>
            <StepCount>
              {t("creator.stepCount", "Step {{n}} of {{total}}", { n: index + 1, total: STEPS.length })}
            </StepCount>
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
        <Paper>
          <Hint>{t(`creator.steps.${creator.step}.hint`)}</Hint>
          {creator.step === "identity" && <IdentityStep {...stepProps} />}
          {creator.step === "stats" && <StatsStep {...stepProps} />}
          {creator.step === "origins" && <OriginsStep {...stepProps} />}
          {creator.step === "gettingBetter" && <GettingBetterStep {...stepProps} />}
          {creator.step === "review" && (
            <ReviewStep
              draft={creator.draft}
              language={creator.language}
              testRoll={creator.testRoll}
              issues={creator.issues}
              onFix={fix}
              saving={creator.saving}
              saved={creator.saved}
              blocked={creator.blocked}
              onSave={creator.save}
            />
          )}
        </Paper>
        <Nav>
          <BackButton
            type="button"
            disabled={!previous}
            aria-keyshortcuts="Alt+ArrowLeft"
            onClick={() => previous && goTo(previous)}
          >
            <ArrowBackIcon aria-hidden="true" />
            {previous ? t(`creator.steps.${previous}.label`) : t("creator.back", "Back")}
          </BackButton>
          {next && (
            <NextButton type="button" aria-keyshortcuts="Alt+ArrowRight" onClick={() => goTo(next)}>
              {t(`creator.steps.${next}.label`)}
              <ArrowForwardIcon aria-hidden="true" />
            </NextButton>
          )}
        </Nav>
      </section>
    </Layout>
  );
}
