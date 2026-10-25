import { obrAuthClient } from "@/auth/obrAuthClient";
import {
  completeObrAuthHandoff,
  type ObrHandoffApproval,
} from "@tackgnol/rpgtools-shared-auth/client";
import { useEffect, useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Wrapper } from "./ObrAuthDonePage.styles";

export function ObrAuthDonePage() {
  const { t } = useTranslation();
  const [approval, setApproval] = useState<ObrHandoffApproval | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handoffId = new URLSearchParams(window.location.search).get(
    "handoffId",
  );

  useEffect(() => {
    let active = true;
    if (!handoffId) {
      setError(t("obr.auth.unavailable"));
      return;
    }
    void obrAuthClient.inspectObrHandoff(handoffId).then(
      (result) => {
        if (active) {
          setApproval(result);
        }
      },
      () => {
        if (active) {
          setError(t("obr.auth.unavailable"));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [handoffId, t]);

  async function approve() {
    if (
      !handoffId ||
      !approval ||
      busy ||
      code.toUpperCase() !== approval.code
    ) {
      return;
    }
    setBusy(true);
    try {
      await completeObrAuthHandoff(obrAuthClient, {
        handoffId,
        code: code.toUpperCase(),
        expectedUserId: approval.user.id,
      });
      setFinished(true);
    } catch {
      setError(t("obr.auth.unavailable"));
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
      setApproval(null);
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
        {error && <Alert severity="error">{error}</Alert>}
        {finished ? (
          <Typography role="status">{t("obr.auth.approved")}</Typography>
        ) : (
          approval && (
            <>
              <Typography>{approval.user.name}</Typography>
              <Typography>{approval.user.email}</Typography>
              <Typography>
                {t("obr.auth.destination", {
                  destination: approval.destination,
                })}
              </Typography>
              <Typography>{t("obr.auth.warning")}</Typography>
              <Typography component="code">{approval.code}</Typography>
              <TextField
                label={t("obr.auth.code")}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="off"
              />
              <Button
                variant="contained"
                onClick={() => void approve()}
                disabled={busy || code.toUpperCase() !== approval.code}
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
