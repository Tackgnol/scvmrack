import type { ModerationRemovalHistoryProps } from "./ModerationRemovalHistory.models";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

/** Shows a GM's earlier class-removal decisions to moderators reviewing a report. */
export function ModerationRemovalHistory({ history }: ModerationRemovalHistoryProps) {
  const { t } = useTranslation();

  return (
    <Box component="details" sx={{ borderLeft: 4, borderColor: "warning.main", pl: 2 }}>
      <Typography component="summary" sx={{ cursor: "pointer", fontWeight: 700 }}>
        {t("moderation.removalHistory", { count: history.length })}
      </Typography>
      <Box component="ul" sx={{ pl: 2, mb: 0 }}>
        {history.map((entry) => (
          <Box component="li" key={entry.id} sx={{ mb: 1 }}>
            <Typography>{entry.className} · {new Date(entry.date).toLocaleString()} · {t(entry.restored ? "moderation.restored" : "moderation.notRestored")}</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{entry.reason ?? "—"}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
