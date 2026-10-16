import { listModerationLog, moderationKeys } from "@/api/moderation";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/** The newest moderation decisions: what was done, to which class, by whom, when and why. */
export function ModerationLogPanel() {
  const { t } = useTranslation();
  const log = useQuery({ queryKey: moderationKeys.log, queryFn: listModerationLog });

  return (
    <Paper component="section" aria-labelledby="moderation-log-title" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography id="moderation-log-title" component="h2" variant="h6">
          {t("moderation.log.title", "Moderation log")}
        </Typography>
        {log.error && (
          <Alert severity="error">
            {getUserFacingApiErrorMessage(log.error, t, t("moderation.log.loadFailed", "The moderation log didn't load."))}
          </Alert>
        )}
        {log.data?.length === 0 && <Typography>{t("moderation.log.empty", "No decisions yet.")}</Typography>}
        {log.data && log.data.length > 0 && (
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
            {log.data.map((entry) => (
              <li key={entry.id}>
                <Typography variant="body2">
                  <strong>{t(`moderation.log.actions.${entry.action}`, entry.action)}</strong>
                  {entry.className && ` · ${entry.className}`}
                  {entry.ground && ` · ${t(`report.reasons.${entry.ground}`)}`}
                  {` · ${new Date(entry.createdAt).toLocaleString()}`}
                </Typography>
                {entry.reason && (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {entry.reason}
                  </Typography>
                )}
              </li>
            ))}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
