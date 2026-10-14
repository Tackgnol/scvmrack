import { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { partyColors } from "@/theme/partyTokens";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ModerationReportItemProps } from "./ModerationReportItem.models";
import { Consequences } from "./ModerationReportItem.styles";

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
        {report.disputes.length > 0 && (
          <Stack spacing={1} sx={{ border: "2px solid", borderColor: "secondary.main", p: 2 }}>
            <Typography variant="subtitle2">{t("moderation.disputes", "Author disputes")}</Typography>
            {report.disputes.map((dispute) => (
              <Box key={dispute.id}>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{dispute.text}</Typography>
                <Typography variant="caption">{new Date(dispute.createdAt).toLocaleString()}</Typography>
              </Box>
            ))}
          </Stack>
        )}
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
            {open && (
              <Consequences id={`consequences-${report.id}`}>
                <li>
                  <strong>{t("moderation.dismiss", "Dismiss")}</strong>:{" "}
                  {t("moderation.dismissEffect", "the class stays public and this report closes.")}
                </li>
                <li>
                  <strong>{builtIn ? t("moderation.hide", "Hide") : t("moderation.takeDown", "Take down")}</strong>:{" "}
                  {t(
                    "moderation.takeDownEffect",
                    "hidden from search, pickers and party pools; no new characters. Existing characters keep it.",
                  )}
                </li>
                {!builtIn && (
                  <li>
                    <strong>{t("moderation.removeContent", "Remove content")}</strong>:{" "}
                    {t(
                      "moderation.removeContentEffect",
                      "its text becomes \u201c[removed by moderation]\u201d everywhere, including existing characters.",
                    )}
                  </li>
                )}
              </Consequences>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ "& .MuiButton-root": { minHeight: 44 }, "& .MuiButton-root.Mui-disabled": { color: partyColors.mutedText } }}
            >
              {open ? (
                <>
                  <Button aria-describedby={describedBy} disabled={disabled} onClick={onDismiss}>
                    {t("moderation.dismiss", "Dismiss")}
                  </Button>
                  <ModalButton variant="danger" aria-describedby={describedBy} disabled={disabled} onClick={() => onConfirm("takeDown")}>
                    {builtIn ? t("moderation.hide", "Hide") : t("moderation.takeDown", "Take down")}
                  </ModalButton>
                  {!builtIn && (
                    <ModalButton
                      variant="danger"
                      aria-describedby={describedBy}
                      disabled={disabled}
                      onClick={() => onConfirm("removeContent")}
                    >
                      {t("moderation.removeContent", "Remove content")}
                    </ModalButton>
                  )}
                </>
              ) : (
                <Button color="success" variant="contained" aria-describedby={describedBy} disabled={disabled} onClick={onRestore}>
                  {t("moderation.restore", "Restore")}
                </Button>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
