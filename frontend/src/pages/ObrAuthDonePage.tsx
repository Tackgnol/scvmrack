import { obrAuthClient } from "@/auth/obrAuthClient";
import {
  completeObrAuthHandoff,
  RpgToolsAuthClientError,
} from "@tackgnol/rpgtools-shared-auth/client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Wrapper } from "./ObrAuthDonePage.styles";

export function ObrAuthDonePage() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handoffId = new URLSearchParams(window.location.search).get(
    "handoffId",
  );

  const approvalQuery = useQuery({
    queryKey: ["auth", "obr-handoff", handoffId],
    queryFn: () => obrAuthClient.inspectObrHandoff(handoffId!),
    enabled: Boolean(handoffId) && !finished && !cancelled,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const approval = approvalQuery.data;
  const failure =
    error ??
    (!handoffId || approvalQuery.isError ? t("obr.auth.unavailable") : null);

  async function approve() {
    if (
      !handoffId ||
      !approval ||
      busy ||
      !/^[A-F0-9]{6}$/i.test(code.trim())
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeObrAuthHandoff(obrAuthClient, {
        handoffId,
        code: code.trim().toUpperCase(),
        expectedUserId: approval.user.id,
      });
      setFinished(true);
    } catch (error) {
      setError(
        t(
          error instanceof RpgToolsAuthClientError && error.status === 400
            ? "obr.auth.codeMismatch"
            : "obr.auth.unavailable",
        ),
      );
    }
    setBusy(false);
  }
  async function cancel() {
    if (!handoffId || busy) {
      return;
    }
    setBusy(true);
    try {
      await obrAuthClient.rejectObrHandoff(handoffId);
      setCancelled(true);
      setError(t("obr.auth.cancelled"));
    } catch {
      setError(t("obr.auth.unavailable"));
    }
    setBusy(false);
  }
  return (
    <Wrapper>
      <Stack spacing={2} maxWidth={440}>
        <Typography variant="h4" component="h1">
          {t("obr.auth.heading")}
        </Typography>
        {failure && <Alert severity="error">{failure}</Alert>}
        {finished ? (
          <Typography role="status">{t("obr.auth.approved")}</Typography>
        ) : (
          approval &&
          !approvalQuery.isError &&
          !cancelled && (
            <>
              <Typography>{approval.user.name}</Typography>
              <Typography>{approval.user.email}</Typography>
              <Typography>
                {t("obr.auth.destination", {
                  destination: approval.destination,
                })}
              </Typography>
              <Typography>{t("obr.auth.warning")}</Typography>
              <TextField
                label={t("obr.auth.code")}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="off"
              />
              <Button
                variant="contained"
                onClick={() => void approve()}
                disabled={busy || !/^[A-F0-9]{6}$/i.test(code.trim())}
              >
                {t("obr.auth.approve")}
              </Button>
              <Button onClick={() => void cancel()} disabled={busy}>
                {t("obr.auth.cancel")}
              </Button>
            </>
          )
        )}
      </Stack>
    </Wrapper>
  );
}
