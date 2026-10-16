import { classKeys, getClassDetail } from "@/api/classes";
import { REPORT_REASONS, type ReportReason } from "@/api/reports";
import { getApiLocale } from "@/hooks/utils";
import { APPEAL_ADDRESS } from "@/legal/contact";
import { CardAction } from "@/pages/gmPages.styles";
import { partyColors } from "@/theme/partyTokens";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { localizedText } from "@/utils/localizedText";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { ReportFormProps } from "./ReportForm.models";
import {
  ANONYMOUS_REASON,
  reportFormSchema,
  type ReportFormValues,
} from "./ReportForm.schemas";
import { parseClassReference } from "./ReportForm.utils";

/** The public report form: which class, why, and who is reporting, checked before it can be sent. */
export function ReportForm({
  initialClassId,
  pending,
  error,
  onSubmit,
}: ReportFormProps) {
  const { t, i18n } = useTranslation();
  const { control, handleSubmit } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: "onChange",
    defaultValues: {
      classReference: initialClassId ?? "",
      reason: "",
      explanation: "",
      name: "",
      email: "",
      website: "",
      goodFaith: false,
    },
  });
  const values = useWatch({ control });
  const [editingClass, setEditingClass] = useState(!initialClassId);
  const referencedId = parseClassReference(values.classReference ?? "");
  const knownClass = useQuery({
    queryKey: classKeys.detail(referencedId ?? 0),
    queryFn: () => getClassDetail(referencedId ?? 0),
    enabled: referencedId !== null,
    retry: false,
  });
  const locale = getApiLocale(i18n.language);
  const className =
    knownClass.data && localizedText(knownClass.data.draft.name, locale);
  const anonymousAllowed = values.reason === ANONYMOUS_REASON;
  const fieldLabels: Record<keyof ReportFormValues, string> = {
    classReference: t("report.classId", "Class reference"),
    reason: t("report.reason", "Reason"),
    explanation: t("report.explanation", "Explain what happened"),
    name: t("report.name", "Your name"),
    email: t("report.email", "Your email"),
    website: "",
    goodFaith: t("report.goodFaithShort", "Good-faith confirmation"),
  };
  // The whole form is checked on every change, so the list stays right when one field relaxes another.
  const checked = reportFormSchema.safeParse(values);
  const failing = new Set(
    checked.success ? [] : checked.error.issues.map((issue) => issue.path[0]),
  );
  const missing = (Object.keys(fieldLabels) as Array<keyof ReportFormValues>)
    .filter((field) => failing.has(field))
    .map((field) => fieldLabels[field]);

  const submit = handleSubmit((form) => {
    const classId = parseClassReference(form.classReference);
    if (classId === null) {
      return;
    }
    onSubmit({
      classId,
      reason: form.reason as ReportReason,
      explanation: form.explanation,
      reporterName: form.name,
      reporterEmail: form.email,
      website: form.website,
      locale,
    });
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "2px solid",
        borderColor: "text.primary",
      }}
    >
      <Stack spacing={2}>
        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              aria-hidden="true"
              autoComplete="off"
              style={{ left: "-10000px", position: "absolute" }}
              tabIndex={-1}
              type="text"
            />
          )}
        />
        {error != null && (
          <Alert severity="error">
            {getUserFacingApiErrorMessage(
              error,
              t,
              t("report.submitFailed", "Your report could not be submitted."),
            )}
          </Alert>
        )}
        {editingClass || !className ? (
          <Controller
            name="classReference"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t("report.classId", "Class reference")}
                helperText={
                  className
                    ? t("report.reportingClass", "Reporting: {{name}}", {
                        name: className,
                      })
                    : t(
                        "report.classIdHint",
                        "The number or link of the class page, such as /classes/12.",
                      )
                }
                required
              />
            )}
          />
        ) : (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
          >
            <Typography sx={{ fontWeight: 700 }}>
              {t("report.reportingClass", "Reporting: {{name}}", {
                name: className,
              })}
            </Typography>
            <CardAction
              className="secondary"
              onClick={() => setEditingClass(true)}
            >
              {t("report.otherClass", "Report a different class")}
            </CardAction>
          </Stack>
        )}
        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label={t("report.reason", "Reason")}
              required
              SelectProps={{
                MenuProps: {
                  slotProps: {
                    paper: { sx: { maxWidth: "calc(100vw - 32px)" } },
                  },
                },
              }}
              sx={{
                "& .MuiSelect-select.MuiSelect-select": {
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                },
              }}
            >
              {REPORT_REASONS.map((value) => (
                <MenuItem
                  key={value}
                  value={value}
                  sx={{ whiteSpace: "normal" }}
                >
                  {t(`report.reasons.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="explanation"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("report.explanation", "Explain what happened")}
              multiline
              minRows={5}
              required
              inputProps={{ maxLength: 4000 }}
            />
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("report.name", "Your name")}
              required={!anonymousAllowed}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("report.email", "Your email")}
              type="email"
              required={!anonymousAllowed}
            />
          )}
        />
        <Controller
          name="goodFaith"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  sx={{ width: 44, height: 44 }}
                  checked={value}
                  onChange={(event) => onChange(event.target.checked)}
                />
              }
              label={t(
                "report.goodFaith",
                "I am submitting this report in good faith.",
              )}
            />
          )}
        />
        {missing.length > 0 && (
          <Typography
            id="report-missing"
            variant="body2"
            sx={{ maxWidth: "65ch" }}
          >
            {t("report.missing", "Still needed: {{fields}}", {
              fields: missing.join(", "),
            })}
          </Typography>
        )}
        <CardAction
          onClick={() => void submit()}
          aria-describedby={missing.length > 0 ? "report-missing" : undefined}
          disabled={pending || missing.length > 0}
        >
          {pending
            ? t("report.sending", "Sending...")
            : t("report.submit", "Submit report")}
        </CardAction>
        <Typography
          variant="body2"
          sx={{
            "& a": { color: partyColors.yellow, textUnderlineOffset: 3 },
          }}
        >
          {t(
            "report.appeal",
            "You may challenge the outcome by emailing {{appealAddress}}.",
            { appealAddress: APPEAL_ADDRESS },
          )}{" "}
          <Link to="/terms" hash="reporting">
            {t("nav.terms")}
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
}
