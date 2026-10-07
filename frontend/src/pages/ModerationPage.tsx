import {
  dismissModerationReport,
  listOpenModerationReports,
  takeDownModerationReport,
} from "@/api/moderation";
import { Seo } from "@/seo/Seo";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Allows an allowlisted moderator to make a documented human decision on an open report. */
export function ModerationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const reports = useQuery({
    queryKey: ["moderation", "reports"],
    queryFn: listOpenModerationReports,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["moderation", "reports"] });
  const dismiss = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => dismissModerationReport(id, reason),
    onSuccess: refresh,
  });
  const takeDown = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => takeDownModerationReport(id, reason),
    onSuccess: refresh,
  });

  const act = (id: string, action: "dismiss" | "takeDown") => {
    const reason = reasons[id]?.trim();
    if (!reason) return;
    (action === "dismiss" ? dismiss : takeDown).mutate({ id, reason });
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", py: { xs: 3, sm: 6 }, px: 2 }}>
      <Seo title="Moderation" description="Review public class reports." path="/admin/moderation" noIndex />
      <Stack spacing={2}>
        <Box>
          <Typography component="h1" variant="h3" sx={{ fontWeight: 800 }}>
            {t("moderation.title", "Moderation")}
          </Typography>
          <Typography>{t("moderation.intro", "Open reports require a human decision.")}</Typography>
        </Box>
        {reports.error && (
          <Alert severity="error">
            {getUserFacingApiErrorMessage(reports.error, t, "You cannot load moderation reports.")}
          </Alert>
        )}
        {reports.isLoading && <Typography>{t("actions.loading", "Loading...")}</Typography>}
        {reports.data?.length === 0 && (
          <Alert severity="success">{t("moderation.empty", "No open reports.")}</Alert>
        )}
        {reports.data?.map((report) => {
          const pending = dismiss.isPending || takeDown.isPending;
          return (
            <Paper key={report.id} elevation={0} sx={{ p: 2, border: "2px solid", borderColor: "text.primary" }}>
              <Stack spacing={1.5}>
                {report.serious && (
                  <Alert severity="error">{t("moderation.authority", "Needs authority report")}</Alert>
                )}
                <Typography variant="h6">{report.className} · #{report.classId}</Typography>
                <Typography>{t(`report.reasons.${report.reason}`)}</Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{report.explanation}</Typography>
                <Typography variant="body2">
                  {report.reporterName ?? t("moderation.anonymous", "Anonymous")} · {report.reporterEmail ?? "—"}
                </Typography>
                <TextField
                  label={t("moderation.decisionReason", "Decision reason")}
                  value={reasons[report.id] ?? ""}
                  onChange={(event) => setReasons((current) => ({ ...current, [report.id]: event.target.value }))}
                  multiline
                  minRows={2}
                  inputProps={{ maxLength: 4000 }}
                  required
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "dismiss")}>
                    {t("moderation.dismiss", "Dismiss")}
                  </Button>
                  <Button color="error" variant="contained" disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "takeDown")}>
                    {t("moderation.takeDown", "Take down")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}