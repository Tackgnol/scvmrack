import { Box, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { DecisionButtons } from "../DecisionButtons/DecisionButtons";
import { DecisionConsequences } from "../DecisionConsequences/DecisionConsequences";
import { ReportDisputes } from "../ReportDisputes/ReportDisputes";
import type { ModerationReportItemProps } from "./ModerationReportItem.models";

/** One report in the moderation queue: what was reported, any author disputes, and the decision controls. */
export function ModerationReportItem({
  report,
  showHeading,
  builtIn,
  reason,
  onReasonChange,
  pending,
  onDismiss,
  onRestore,
  onConfirm,
}: ModerationReportItemProps) {
  const { t } = useTranslation();
  const open = report.status === "open";
  const reviewable = open || report.status === "taken_down" || report.status === "content_removed";
  const missingReason = !reason.trim();
  const describedBy =
    [missingReason && `reason-hint-${report.id}`, open && `consequences-${report.id}`].filter(Boolean).join(" ") ||
    undefined;
  const disabled = pending || missingReason;

  return (
    <Box component="article" sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
      <Stack spacing={1.5}>
        {showHeading && (
          <Typography component="h4" variant="h6">
            {report.className} · {t("moderation.version", { version: report.classVersion })}
          </Typography>
        )}
        <Typography sx={{ fontWeight: 700 }}>{t(`report.reasons.${report.reason}`)}</Typography>
        <Typography sx={{ whiteSpace: "pre-wrap" }}>{report.explanation}</Typography>
        <Typography variant="body2">
          {report.reporterName ?? t("moderation.anonymous", "Anonymous")} · {report.reporterEmail ?? "—"}
        </Typography>
        {report.disputes.length > 0 && <ReportDisputes disputes={report.disputes} />}
        {reviewable && (
          <>
            <TextField
              label={t("moderation.decisionReason", "Decision reason")}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              multiline
              minRows={2}
              inputProps={{ maxLength: 4000 }}
              required
            />
            {missingReason && (
              <Typography id={`reason-hint-${report.id}`} variant="body2">
                {t("moderation.reasonRequired", "Write a decision reason to act.")}
              </Typography>
            )}
            {open && <DecisionConsequences id={`consequences-${report.id}`} builtIn={builtIn} />}
            <DecisionButtons
              open={open}
              builtIn={builtIn}
              disabled={disabled}
              describedBy={describedBy}
              onDismiss={onDismiss}
              onRestore={onRestore}
              onConfirm={onConfirm}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}
