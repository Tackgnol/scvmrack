import {
  dismissModerationReport,
  listOpenModerationReports,
  removeModerationContent,
  restoreModerationReport,
  takeDownModerationReport,
} from "@/api/moderation";
import { Seo } from "@/seo/Seo";
import { CreationBanPanel } from "@/components/organisms/CreationBanPanel/CreationBanPanel";
import { ModerationRemovalHistory } from "@/components/organisms/ModerationRemovalHistory/ModerationRemovalHistory";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
  const removeContent = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => removeModerationContent(id, reason),
    onSuccess: refresh,
  });
  const restore = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => restoreModerationReport(id, reason),
    onSuccess: refresh,
  });

  const act = (id: string, action: "dismiss" | "takeDown" | "removeContent" | "restore") => {
    const reason = reasons[id]?.trim();
    if (!reason) return;
    (action === "dismiss" ? dismiss : action === "takeDown" ? takeDown : action === "removeContent" ? removeContent : restore).mutate({ id, reason });
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
        <CreationBanPanel />
        {reports.error && (
          <Alert severity="error">
            {getUserFacingApiErrorMessage(reports.error, t, "You cannot load moderation reports.")}
          </Alert>
        )}
        {reports.isLoading && <Typography>{t("actions.loading", "Loading...")}</Typography>}
        {reports.data?.length === 0 && (
          <Alert severity="success">{t("moderation.empty", "No open reports.")}</Alert>
        )}
        {reports.data?.map((group) => (
          <Paper key={group.lineageId} component="section" elevation={0} sx={{ p: 2, border: "2px solid", borderColor: "text.primary" }}>
            <Stack spacing={1.5}>
              <Box>
                <Typography component="h2" variant="h5">{group.latest.name}</Typography>
                {group.ownerUserId && <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{t("moderation.gmUserId", "GM user ID")}: {group.ownerUserId}</Typography>}
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Button component={Link} to={`/classes/${group.latest.id}`} size="small" variant="contained">
                    {t("moderation.previewLatest", "Preview latest version")} · {t("moderation.version", { version: group.latest.version })}
                  </Button>
                  {group.versions.slice(1).map((version) => (
                    <Button key={version.id} component={Link} to={`/classes/${version.id}`} size="small">
                      {t("moderation.version", { version: version.version })}
                    </Button>
                  ))}
                </Stack>
              </Box>
              {group.removalHistory !== null && (
                <ModerationRemovalHistory history={group.removalHistory} />
              )}
              <Typography variant="subtitle2">{t("moderation.classVersions", "Class versions")}</Typography>
              {group.reports.map((report) => {
                const pending = dismiss.isPending || takeDown.isPending || removeContent.isPending || restore.isPending;
                const reviewable = report.status === "open" || report.status === "taken_down" || report.status === "content_removed";
                return (
                  <Box key={report.id} component="article" sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
                    <Stack spacing={1.5}>
                      {report.serious && (
                        <Alert severity="error">{t("moderation.authority", "Needs authority report")}</Alert>
                      )}
                      <Typography component="h3" variant="h6">{report.className} · {t("moderation.version", { version: report.classVersion })}</Typography>
                      <Typography>{t(`report.reasons.${report.reason}`)}</Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{report.explanation}</Typography>
                      <Typography variant="body2">
                        {report.reporterName ?? t("moderation.anonymous", "Anonymous")} · {report.reporterEmail ?? "—"}
                      </Typography>
                      {report.disputes.length > 0 && (
                        <Stack spacing={1} sx={{ borderLeft: 4, borderColor: "warning.main", pl: 2 }}>
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
                            value={reasons[report.id] ?? ""}
                            onChange={(event) => setReasons((current) => ({ ...current, [report.id]: event.target.value }))}
                            multiline
                            minRows={2}
                            inputProps={{ maxLength: 4000 }}
                            required
                          />
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            {report.status === "open" ? (
                              <>
                                <Button disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "dismiss")}>
                                  {t("moderation.dismiss", "Dismiss")}
                                </Button>
                                <Button color="error" variant="contained" disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "takeDown")}>
                                  {t("moderation.takeDown", "Take down")}
                                </Button>
                                <Button color="error" disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "removeContent")}>
                                  {t("moderation.removeContent", "Remove content")}
                                </Button>
                              </>
                            ) : (
                              <Button color="success" variant="contained" disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "restore")}>
                                {t("moderation.restore", "Restore")}
                              </Button>
                            )}
                          </Stack>
                        </>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
