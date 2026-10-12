import { CardAction } from "@/pages/gmPages.styles";
import { partyFonts } from "@/theme/partyTokens";
import { banClassCreation, getCreationBan, unbanClassCreation } from "@/api/moderation";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

/** Looks up one GM's creation restriction and records ban decisions. */
export function CreationBanPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [inputUserId, setInputUserId] = useState("");
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const lookup = useQuery({
    queryKey: ["moderation", "creation-ban", userId],
    queryFn: () => getCreationBan(userId),
    enabled: userId.length > 0,
    retry: false,
  });
  const refresh = () => {
    setReason("");
    void queryClient.invalidateQueries({ queryKey: ["moderation", "creation-ban", userId] });
  };
  const ban = useMutation({
    mutationFn: () => banClassCreation(userId, reason.trim()),
    onSuccess: refresh,
  });
  const unban = useMutation({
    mutationFn: () => unbanClassCreation(userId, reason.trim()),
    onSuccess: refresh,
  });
  const pending = ban.isPending || unban.isPending;

  const submitLookup = (event: FormEvent) => {
    event.preventDefault();
    setUserId(inputUserId.trim());
  };

  return (
    <Paper component="section" elevation={0} sx={{ p: 2, border: "2px solid", borderColor: "text.primary" }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h5" sx={{ fontFamily: partyFonts.headline, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t("moderation.creationBans", "Class creation bans")}</Typography>
        <Stack component="form" onSubmit={submitLookup} direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField label={t("moderation.gmUserId", "GM user ID")} value={inputUserId} onChange={(event) => setInputUserId(event.target.value)} required fullWidth />
          <CardAction type="submit" sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>{t("moderation.lookUp", "Look up")}</CardAction>
        </Stack>
        {lookup.isLoading && <Typography>{t("actions.loading", "Loading...")}</Typography>}
        {lookup.error && <Alert severity="error">{getUserFacingApiErrorMessage(lookup.error, t, "Could not load this GM.")}</Alert>}
        {lookup.data && (
          <Stack spacing={1.5}>
            <Typography sx={{ overflowWrap: "anywhere" }}>{t("moderation.gmUserId", "GM user ID")}: {lookup.data.userId}</Typography>
            <Alert severity={lookup.data.active ? "warning" : "success"}>
              {lookup.data.active
                ? t("moderation.creationBanActive", "Creation banned")
                : t("moderation.creationBanInactive", "Creation allowed")}
              {lookup.data.active && <> · {lookup.data.active.reason}</>}
            </Alert>
            <TextField label={t("moderation.decisionReason", "Decision reason")} value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={2} inputProps={{ maxLength: 4000 }} required />
            <Button
              variant="contained"
              color={lookup.data.active ? "success" : "error"}
              disabled={pending || !reason.trim()}
              onClick={() => (lookup.data.active ? unban : ban).mutate()}
            >
              {lookup.data.active ? t("moderation.liftCreationBan", "Lift creation ban") : t("moderation.banCreation", "Ban class creation")}
            </Button>
            {(ban.error || unban.error) && (
              <Alert severity="error">{getUserFacingApiErrorMessage(ban.error ?? unban.error, t, "Could not save the ban decision.")}</Alert>
            )}
            <Typography component="h3" variant="h6">{t("moderation.creationBanHistory", "Ban history")}</Typography>
            {lookup.data.history.length === 0 && <Typography>{t("moderation.noBanHistory", "No ban decisions yet.")}</Typography>}
            {lookup.data.history.length > 0 && (
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {lookup.data.history.map((entry) => (
                  <Box component="li" key={entry.id} sx={{ mb: 1 }}>
                    <Typography>{t(entry.action === "class_creation_banned" ? "moderation.banCreation" : "moderation.liftCreationBan")} · {new Date(entry.date).toLocaleString()}</Typography>
                    <Typography>{t("moderation.byActor", "By {{actor}}", { actor: entry.actorUserId ?? "—" })}</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{entry.reason ?? "—"}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
