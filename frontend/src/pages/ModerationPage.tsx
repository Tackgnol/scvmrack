import {
  dismissModerationReport,
  listOpenModerationReports,
  removeModerationContent,
  restoreModerationReport,
  takeDownModerationReport,
} from "@/api/moderation";
import MorkBorgModal, { ModalButton } from "@/components/molecules/modal/MorkBorgModal";
import { CardAction, Lede, Stamp, Title } from "@/pages/gmPages.styles";
import { AuthorityStamp, Consequences, ModerationCard } from "./ModerationPage.styles";
import { partyColors } from "@/theme/partyTokens";
import { Seo } from "@/seo/Seo";
import { CreationBanPanel } from "@/components/organisms/CreationBanPanel/CreationBanPanel";
import { ModerationRemovalHistory } from "@/components/organisms/ModerationRemovalHistory/ModerationRemovalHistory";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Allows an allowlisted moderator to make a documented human decision on an open report. */
export function ModerationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const describedBy = (report: { id: string; status: string }) =>
    [!reasons[report.id]?.trim() && `reason-hint-${report.id}`, report.status === "open" && `consequences-${report.id}`]
      .filter(Boolean)
      .join(" ") || undefined;
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

  const [confirming, setConfirming] = useState<{
    id: string;
    action: "takeDown" | "removeContent";
    className: string;
    version: number;
  } | null>(null);

  const act = (id: string, action: "dismiss" | "takeDown" | "removeContent" | "restore") => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      return;
    }
    (action === "dismiss" ? dismiss : action === "takeDown" ? takeDown : action === "removeContent" ? removeContent : restore).mutate({ id, reason });
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", py: { xs: 3, sm: 6 }, px: 2 }}>
      <Seo title="Moderation" description="Review public class reports." path="/admin/moderation" noIndex />
      <Stack spacing={2}>
        <Stack spacing={1.5}>
          <Stamp>{t("moderation.stamp", "Admin")}</Stamp>
          <Title component="h1">{t("moderation.title", "Moderation")}</Title>
          <Lede>{t("moderation.intro", "Open reports require a human decision.")}</Lede>
        </Stack>
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
          <ModerationCard key={group.lineageId}>
            <Stack spacing={1.5}>
              {group.reports.some((report) => report.serious) && (
                <AuthorityStamp>{t("moderation.authority", "Needs authority report")}</AuthorityStamp>
              )}
              <Box>
                <Typography component="h2" variant="h5">{group.latest.name}</Typography>
                {group.ownerUserId && <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{t("moderation.gmUserIdCopy", "GM user ID · copy for ban lookup")}: {group.ownerUserId}</Typography>}
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <CardAction component={Link} to={`/classes/${group.latest.id}`} className="secondary">
                    {t("moderation.previewLatest", "Preview latest version")} · {t("moderation.version", { version: group.latest.version })}
                  </CardAction>
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
              <Typography component="h3" variant="subtitle2" sx={{ fontSize: "0.8rem" }}>{t("moderation.classVersions", "Class versions")}</Typography>
              {[...group.reports].sort((a, b) => b.classVersion - a.classVersion).map((report, index, sorted) => {
                const pending = dismiss.isPending || takeDown.isPending || removeContent.isPending || restore.isPending;
                const reviewable = report.status === "open" || report.status === "taken_down" || report.status === "content_removed";
                return (
                  <Box key={report.id} component="article" sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
                    <Stack spacing={1.5}>
                      {(index === 0 || sorted[index - 1].classVersion !== report.classVersion) && (
                        <Typography component="h4" variant="h6">{report.className} · {t("moderation.version", { version: report.classVersion })}</Typography>
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
                            value={reasons[report.id] ?? ""}
                            onChange={(event) => setReasons((current) => ({ ...current, [report.id]: event.target.value }))}
                            multiline
                            minRows={2}
                            inputProps={{ maxLength: 4000 }}
                            required
                          />
                          {!reasons[report.id]?.trim() && (
                            <Typography id={`reason-hint-${report.id}`} variant="body2">{t("moderation.reasonRequired", "Write a decision reason to act.")}</Typography>
                          )}
                          {report.status === "open" && (
                            <Consequences id={`consequences-${report.id}`}>
                              <li><strong>{t("moderation.dismiss", "Dismiss")}</strong>: {t("moderation.dismissEffect", "the class stays public and this report closes.")}</li>
                              <li><strong>{t("moderation.takeDown", "Take down")}</strong>: {t("moderation.takeDownEffect", "hidden from search, pickers and party pools; no new characters. Existing characters keep it.")}</li>
                              <li><strong>{t("moderation.removeContent", "Remove content")}</strong>: {t("moderation.removeContentEffect", "its text becomes “[removed by moderation]” everywhere, including existing characters.")}</li>
                            </Consequences>
                          )}
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ "& .MuiButton-root": { minHeight: 44 }, "& .MuiButton-root.Mui-disabled": { color: partyColors.mutedText } }}
                          >
                            {report.status === "open" ? (
                              <>
                                <Button aria-describedby={describedBy(report)} disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "dismiss")}>
                                  {t("moderation.dismiss", "Dismiss")}
                                </Button>
                                <ModalButton variant="danger" aria-describedby={describedBy(report)} disabled={pending || !reasons[report.id]?.trim()} onClick={() => setConfirming({ id: report.id, action: "takeDown", className: report.className, version: report.classVersion })}>
                                  {t("moderation.takeDown", "Take down")}
                                </ModalButton>
                                <ModalButton variant="danger" aria-describedby={describedBy(report)} disabled={pending || !reasons[report.id]?.trim()} onClick={() => setConfirming({ id: report.id, action: "removeContent", className: report.className, version: report.classVersion })}>
                                  {t("moderation.removeContent", "Remove content")}
                                </ModalButton>
                              </>
                            ) : (
                              <Button color="success" variant="contained" aria-describedby={describedBy(report)} disabled={pending || !reasons[report.id]?.trim()} onClick={() => act(report.id, "restore")}>
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
          </ModerationCard>
        ))}
      </Stack>
      <MorkBorgModal
        role="alertdialog"
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={
          confirming?.action === "removeContent"
            ? t("moderation.confirmRemoveTitle", "Remove this content?")
            : t("moderation.confirmTakeDownTitle", "Take this class down?")
        }
        maxWidth="xs"
        actions={
          <>
            <ModalButton variant="secondary" onClick={() => setConfirming(null)}>
              {t("actions.cancel", "Cancel")}
            </ModalButton>
            <ModalButton
              variant="danger"
              onClick={() => {
                if (confirming) {
                  act(confirming.id, confirming.action);
                }
                setConfirming(null);
              }}
            >
              {confirming?.action === "removeContent"
                ? t("moderation.removeContent", "Remove content")
                : t("moderation.takeDown", "Take down")}
            </ModalButton>
          </>
        }
      >
        <Typography>
          {t(
            "moderation.confirmBody",
            "“{{name}}” version {{version}} stops being visible right away, every version of it leaves party pools, and the GM gets your reason as the statement of reasons.",
            { name: confirming?.className ?? "", version: confirming?.version ?? "" },
          )}
        </Typography>
      </MorkBorgModal>
    </Box>
  );
}
