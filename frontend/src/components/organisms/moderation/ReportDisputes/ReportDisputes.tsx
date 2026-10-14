import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ReportDisputesProps } from "./ReportDisputes.models";

/** The author's disputes of a decision on a report, oldest first. */
export function ReportDisputes({ disputes }: ReportDisputesProps) {
  const { t } = useTranslation();
  return (
    <Stack spacing={1} sx={{ border: "2px solid", borderColor: "secondary.main", p: 2 }}>
      <Typography variant="subtitle2">{t("moderation.disputes", "Author disputes")}</Typography>
      {disputes.map((dispute) => (
        <Box key={dispute.id}>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{dispute.text}</Typography>
          <Typography variant="caption">{new Date(dispute.createdAt).toLocaleString()}</Typography>
        </Box>
      ))}
    </Stack>
  );
}
