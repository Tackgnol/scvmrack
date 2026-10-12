import { classKeys, getClassDetail } from "@/api/classes";
import {
  REPORT_REASONS,
  submitPublicReport,
  type ReportReason,
} from "@/api/reports";
import { CardAction, Lede, Stamp, Title } from "@/pages/gmPages.styles";
import { Seo } from "@/seo/Seo";
import { partyColors } from "@/theme/partyTokens";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Lets anyone report a class without creating an account. */
export function ReportPage() {
  const { t, i18n } = useTranslation();
  const search = useSearch({ strict: false }) as { classId?: string };
  const [classId, setClassId] = useState(search.classId ?? "");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [explanation, setExplanation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const report = useMutation({ mutationFn: submitPublicReport });
  const numericClassId = Number(classId);
  const knownClass = useQuery({
    queryKey: classKeys.detail(numericClassId),
    queryFn: () => getClassDetail(numericClassId),
    enabled: Number.isSafeInteger(numericClassId) && numericClassId > 0,
    retry: false,
  });
  const className = knownClass.data?.draft.name[i18n.language.startsWith("pl") ? "pl" : "en"] || knownClass.data?.draft.name.en || knownClass.data?.draft.name.pl;
  const anonymousAllowed = reason === "child_sexual_abuse_material";
  const missing = [
    !reason && t("report.reason", "Reason"),
    !explanation.trim() && t("report.explanation", "Explain what happened"),
    !anonymousAllowed && !name.trim() && t("report.name", "Your name"),
    !anonymousAllowed && !email.trim() && t("report.email", "Your email"),
    !goodFaith && t("report.goodFaithShort", "Good-faith confirmation"),
  ].filter(Boolean);

  const submit = () => {
    const id = Number(classId);
    if (!Number.isInteger(id) || id < 1 || !goodFaith || !reason) return;
    report.mutate({
      classId: id,
      reason,
      explanation,
      reporterName: name,
      reporterEmail: email,
      website,
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
        <Stack spacing={1.5}>
          <Stamp>{t("report.stamp", "Notice & action")}</Stamp>
          <Title component="h1">{t("report.title", "Report a class")}</Title>
          <Lede>
            {t(
              "report.intro",
              "Anyone can report public content. A person reviews every report and will explain the outcome.",
            )}
          </Lede>
        </Stack>
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
              <input
                aria-hidden="true"
                autoComplete="off"
                name="website"
                onChange={(event) => setWebsite(event.target.value)}
                style={{ left: "-10000px", position: "absolute" }}
                tabIndex={-1}
                type="text"
                value={website}
              />
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
              {className && <Typography variant="body2">{t("report.reportingClass", "Reporting: {{name}}", { name: className })}</Typography>}
              <TextField
                select
                label={t("report.reason", "Reason")}
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as ReportReason)
                }
                required
                SelectProps={{
                  MenuProps: { slotProps: { paper: { sx: { maxWidth: "calc(100vw - 32px)" } } } },
                }}
                sx={{
                  "& .MuiSelect-select.MuiSelect-select": {
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                  },
                }}
              >
                {REPORT_REASONS.map((value) => (
                  <MenuItem key={value} value={value} sx={{ whiteSpace: "normal" }}>
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={goodFaith}
                    onChange={(event) => setGoodFaith(event.target.checked)}
                  />
                }
                label={t(
                  "report.goodFaith",
                  "I am submitting this report in good faith.",
                )}
              />
              {missing.length > 0 && (
                <Typography id="report-missing" variant="body2">
                  {t("report.missing", "Still needed: {{fields}}", { fields: missing.join(", ") })}
                </Typography>
              )}
              <CardAction
                onClick={submit}
                aria-describedby={missing.length > 0 ? "report-missing" : undefined}
                disabled={report.isPending || missing.length > 0}
              >
                {report.isPending
                  ? t("report.sending", "Sending...")
                  : t("report.submit", "Submit report")}
              </CardAction>
              <Typography
                variant="body2"
                sx={{ "& a": { color: partyColors.yellow, textUnderlineOffset: 3 } }}
              >
                {t(
                  "report.appeal",
                  "You may challenge the outcome by emailing scvmrack-appeal@rpgtools.co.",
                )}{" "}
                <Link to="/terms" hash="reporting">{t("nav.terms")}</Link>
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
