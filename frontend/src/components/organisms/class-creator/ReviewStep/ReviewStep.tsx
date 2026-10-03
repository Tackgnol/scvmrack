import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import CasinoIcon from "@mui/icons-material/Casino";
import { useTranslation } from "react-i18next";
import { ForgedStamp } from "../ForgedStamp/ForgedStamp";
import { IssueList } from "../IssueList/IssueList";
import { TestRollSheet } from "../TestRollSheet/TestRollSheet";
import { GroupHeading, Hint, InkButton, Interrupt, Stack } from "../classCreator.styles";
import type { ReviewStepProps } from "./ReviewStep.models";
import { Columns, SaveButton } from "./ReviewStep.styles";

/** Last step: roll a test scvm from the draft (keeping nothing), see what blocks saving, and save. */
export function ReviewStep({
  draft,
  language,
  testRoll,
  issues,
  onFix,
  saving,
  saved,
  blocked,
  onSave,
}: ReviewStepProps) {
  const { t } = useTranslation();
  const className = draft.name[language] || draft.name[draft.languages[0]] || t("creator.untitled", "Untitled class");

  return (
    <Columns>
      <Stack>
        <div>
          <InkButton type="button" disabled={testRoll.rolling} onClick={testRoll.roll}>
            <CasinoIcon aria-hidden="true" />
            {testRoll.scvm ? t("creator.review.rollAgain", "Roll again") : t("creator.review.roll", "Roll a test scvm")}
          </InkButton>
        </div>
        {testRoll.error ? (
          <Interrupt role="alert" className={blocked ? "quiet" : undefined}>{getUserFacingApiErrorMessage(testRoll.error, t, "Failed to roll a test scvm")}</Interrupt>
        ) : null}
        <div aria-live="polite">
          {testRoll.scvm ? (
            <TestRollSheet scvm={testRoll.scvm} className={className} stale={testRoll.stale} quiet={blocked !== null} />
          ) : (
            <Hint>{t("creator.review.noRoll", "No test roll yet. A test roll uses the draft exactly as it is and keeps nothing.")}</Hint>
          )}
        </div>
      </Stack>
      <Stack>
        <GroupHeading>{t("creator.review.beforeSave", "Before you save")}</GroupHeading>
        <div id="save-status" role="status">
          {blocked && <Interrupt>{blocked}</Interrupt>}
        </div>
        <IssueList issues={issues} onFix={onFix} />
        <SaveButton type="button" aria-describedby="save-status" disabled={saving || saved} onClick={onSave}>
          {saved ? t("creator.review.saved", "Saved") : t("creator.review.save", "Save class")}
        </SaveButton>
        <div role="status">{saved && <ForgedStamp name={draft.name[draft.languages[0]]} />}</div>
      </Stack>
    </Columns>
  );
}
