import {
  dismissModerationReport,
  listOpenModerationReports,
  moderationKeys,
  removeModerationContent,
  restoreModerationReport,
  takeDownModerationReport,
  type ModerationGround,
} from "@/api/moderation";
import { CardAction, Lede, Stamp, Title } from "@/pages/gmPages.styles";
import { AuthorityStamp, ModerationCard } from "./ModerationPage.styles";
import { Seo } from "@/seo/Seo";
import { CreationBanPanel } from "@/components/organisms/CreationBanPanel/CreationBanPanel";
import { ModerationRemovalHistory } from "@/components/organisms/ModerationRemovalHistory/ModerationRemovalHistory";
import { ModerationLogPanel } from "@/components/organisms/ModerationLogPanel/ModerationLogPanel";
import { ModerationDecisionDialog } from "@/components/organisms/moderation/ModerationDecisionDialog/ModerationDecisionDialog";
import type { PendingDecision } from "@/components/organisms/moderation/ModerationDecisionDialog/ModerationDecisionDialog.models";
import { ModerationReportItem } from "@/components/organisms/moderation/ModerationReportItem/ModerationReportItem";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, type RegisteredRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Decision = "dismiss" | "takeDown" | "removeContent" | "restore";

const DECISIONS: Record<Decision, (id: string, reason: string, ground: ModerationGround) => Promise<unknown>> = {
  dismiss: (id, reason) => dismissModerationReport(id, reason),
  takeDown: takeDownModerationReport,
  removeContent: removeModerationContent,
  restore: (id, reason) => restoreModerationReport(id, reason),
};

/** Allows an allowlisted moderator to make a documented human decision on an open report. */
export function ModerationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const reports = useQuery({
    queryKey: moderationKeys.reports,
    queryFn: listOpenModerationReports,
  });
  const decide = useMutation({
    mutationFn: ({ action, id, reason, ground }: { action: Decision; id: string; reason: string; ground: ModerationGround }) =>
      DECISIONS[action](id, reason, ground),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.reports });
      void queryClient.invalidateQueries({ queryKey: moderationKeys.log });
    },
  });

  const [confirming, setConfirming] = useState<PendingDecision | null>(null);

  const act = (id: string, action: Decision, ground: ModerationGround = "other") => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      return;
    }
    decide.mutate({ action, id, reason, ground });
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", py: { xs: 3, sm: 6 }, px: 2 }}>
      <Seo title={t("moderation.title", "Moderation")} description="Review public class reports." path="/admin/moderation" noIndex />
      <Stack spacing={2}>
        <Stack spacing={1.5}>
          <Stamp>{t("moderation.stamp", "Admin")}</Stamp>
          <Title component="h1">{t("moderation.title", "Moderation")}</Title>
          <Lede>{t("moderation.intro", "Open reports require a human decision.")}</Lede>
        </Stack>
        <CreationBanPanel />
        <ModerationLogPanel />
        {decide.error && (
          <Alert severity="error" role="alert">
            {getUserFacingApiErrorMessage(decide.error, t, t("moderation.decisionFailed", "The decision didn't save. Try again."))}
          </Alert>
        )}
        {reports.error && (
          <Alert severity="error">
            {getUserFacingApiErrorMessage(reports.error, t, t("moderation.loadFailed", "You cannot load moderation reports."))}
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
                  <CardAction component={Link<RegisteredRouter, string, '/classes/$classId'>} to="/classes/$classId" params={{ classId: String(group.latest.id) }} className="secondary">
                    {t("moderation.previewLatest", "Preview latest version")} · {t("moderation.version", { version: group.latest.version })}
                  </CardAction>
                  {group.versions.slice(1).map((version) => (
                    <Button key={version.id} component={Link<RegisteredRouter, string, '/classes/$classId'>} to="/classes/$classId" params={{ classId: String(version.id) }} size="small">
                      {t("moderation.version", { version: version.version })}
                    </Button>
                  ))}
                </Stack>
              </Box>
              {group.removalHistory !== null && (
                <ModerationRemovalHistory history={group.removalHistory} />
              )}
              <Typography component="h3" variant="subtitle2" sx={{ fontSize: "0.8rem" }}>{t("moderation.classVersions", "Class versions")}</Typography>
              {[...group.reports]
                .sort((a, b) => b.classVersion - a.classVersion)
                .map((report, index, sorted) => (
                  <ModerationReportItem
                    key={report.id}
                    report={report}
                    showHeading={index === 0 || sorted[index - 1].classVersion !== report.classVersion}
                    builtIn={group.builtIn}
                    reason={reasons[report.id] ?? ""}
                    onReasonChange={(reason) => setReasons((current) => ({ ...current, [report.id]: reason }))}
                    pending={decide.isPending}
                    onDismiss={() => act(report.id, "dismiss")}
                    onRestore={() => act(report.id, "restore")}
                    onConfirm={(action) =>
                      setConfirming({
                        reportId: report.id,
                        action,
                        className: report.className,
                        version: report.classVersion,
                        ground: report.reason,
                        builtIn: group.builtIn,
                      })
                    }
                  />
                ))}
            </Stack>
          </ModerationCard>
        ))}
      </Stack>
      <ModerationDecisionDialog
        key={confirming ? `${confirming.reportId}:${confirming.action}` : "closed"}
        decision={confirming}
        onClose={() => setConfirming(null)}
        onConfirm={(ground) => {
          if (confirming) {
            act(confirming.reportId, confirming.action, ground);
          }
          setConfirming(null);
        }}
      />
    </Box>
  );
}
