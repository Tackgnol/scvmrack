import { submitPublicReport } from "@/api/reports";
import { ReportForm } from "@/components/organisms/report/ReportForm/ReportForm";
import { APPEAL_ADDRESS } from "@/legal/contact";
import { Lede, Stamp, Title } from "@/pages/gmPages.styles";
import { Seo } from "@/seo/Seo";
import { Alert, Box, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/** Lets anyone report a class without creating an account. */
export function ReportPage() {
  const { t } = useTranslation();
  const search = useSearch({ from: "/report" });
  // A report changes no cached query: the reporter can't see the moderation queue.
  const report = useMutation({ mutationFn: submitPublicReport });

  return (
    <Box sx={{ maxWidth: 680, mx: "auto", py: { xs: 3, sm: 6 }, px: 2 }}>
      <Seo
        title={t("report.title", "Report a class")}
        description={t("report.description", "Report a class for human review.")}
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
              "Your report was recorded for human review. You can challenge the outcome at {{appealAddress}}.",
              { appealAddress: APPEAL_ADDRESS },
            )}
          </Alert>
        ) : (
          <ReportForm
            initialClassId={search.classId}
            pending={report.isPending}
            error={report.error}
            onSubmit={(input) => report.mutate(input)}
          />
        )}
      </Stack>
    </Box>
  );
}
