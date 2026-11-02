import { Button, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ReportClassReferenceProps } from "./ReportClassReference.models";

export function ReportClassReference({
  reportedClassName,
  editing,
  malformed,
  onEdit,
  ...inputProps
}: ReportClassReferenceProps) {
  const { t } = useTranslation();
  if (editing || !reportedClassName) {
    return (
      <TextField
        {...inputProps}
        label={t("report.classId", "Class reference")}
        error={malformed}
        helperText={
          malformed
            ? t(
                "report.invalidClassReference",
                "Enter a class number or a link such as /classes/12.",
              )
            : reportedClassName
              ? t("report.reportingClass", "Reporting: {{name}}", {
                  name: reportedClassName,
                })
              : t(
                  "report.classIdHint",
                  "The number or link of the class page, such as /classes/12.",
                )
        }
        required
      />
    );
  }
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      useFlexGap
      flexWrap="wrap"
    >
      <Typography sx={{ fontWeight: 700 }}>
        {t("report.reportingClass", "Reporting: {{name}}", {
          name: reportedClassName,
        })}
      </Typography>
      <Button variant="outlined" color="inherit" onClick={onEdit}>
        {t("report.otherClass", "Report a different class")}
      </Button>
    </Stack>
  );
}
