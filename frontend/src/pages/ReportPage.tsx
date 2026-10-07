import {
  REPORT_REASONS,
  submitPublicReport,
  type ReportReason,
} from "@/api/reports";
import { Seo } from "@/seo/Seo";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Lets anyone report a class without creating an account. */
export function ReportPage() {
  const { t, i18n } = useTranslation();
  const search = useSearch({ strict: false }) as { classId?: string };
  const [classId, setClassId] = useState(search.classId ?? "");
  const [reason, setReason] = useState<ReportReason>("copyright");
  const [explanation, setExplanation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const report = useMutation({ mutationFn: submitPublicReport });
  const anonymousAllowed = reason === "child_sexual_abuse_material";

  const submit = () => {
    const id = Number(classId);
    if (!Number.isInteger(id) || id < 1 || !goodFaith) return;
    report.mutate({
      classId: id,
      reason,
      explanation,
      reporterName: name,
      reporterEmail: email,
      locale: i18n.language.startsWith("pl") ? "pl" : "en",
    });
  };

  return (
    <Box sx={{ maxWidth: 680, mx: "auto", py: { xs: 3, sm: 6 }, px: 2 }}>
      <Seo
        title={t("report.title", "Report a class")}
        description={t(
          "report.description",
          "Report a class for human review.",
        )}
        path="/report"
      />
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h3" sx={{ fontWeight: 800 }}>
            {t("report.title", "Report a class")}
          </Typography>
          <Typography sx={{ mt: 1 }}>
            {t(
              "report.intro",
              "Anyone can report public content. A person reviews every report and will explain the outcome.",
            )}
          </Typography>
        </Box>
        {report.isSuccess ? (
          <Alert severity="success">
            {t(
              "report.sent",
              "Your report was recorded for human review. You can challenge the outcome at scvmrack-appeal@rpgtools.co.",
            )}
          </Alert>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              border: "2px solid",
              borderColor: "text.primary",
            }}
          >
            <Stack spacing={2}>
              {report.error && (
                <Alert severity="error">
                  {getUserFacingApiErrorMessage(
                    report.error,
                    t,
                    "Your report could not be submitted.",
                  )}
                </Alert>
              )}
              <TextField
                label={t("report.classId", "Class reference")}
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                inputProps={{ inputMode: "numeric", min: 1 }}
                required
              />
              <TextField
                select
                label={t("report.reason", "Reason")}
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as ReportReason)
                }
              >
                {REPORT_REASONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`report.reasons.${value}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={t("report.explanation", "Explain what happened")}
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                multiline
                minRows={5}
                required
                inputProps={{ maxLength: 4000 }}
              />
              <TextField
                label={t("report.name", "Your name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required={!anonymousAllowed}
              />
              <TextField
                label={t("report.email", "Your email")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required={!anonymousAllowed}
              />
              <label>
                <input
                  type="checkbox"
                  checked={goodFaith}
                  onChange={(event) => setGoodFaith(event.target.checked)}
                />{" "}
                {t(
                  "report.goodFaith",
                  "I am submitting this report in good faith.",
                )}
              </label>
              <Button
                variant="contained"
                onClick={submit}
                disabled={
                  report.isPending ||
                  !explanation.trim() ||
                  !goodFaith ||
                  (!anonymousAllowed && (!name.trim() || !email.trim()))
                }
              >
                {report.isPending
                  ? t("report.sending", "Sending...")
                  : t("report.submit", "Submit report")}
              </Button>
              <Typography variant="body2">
                {t(
                  "report.appeal",
                  "You may challenge the outcome by emailing scvmrack-appeal@rpgtools.co.",
                )}{" "}
                <Link to="/terms">{t("nav.terms")}</Link>
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
