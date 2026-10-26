import { authKeys } from "@/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { obrApprovalSchema } from "./ObrAuthDonePage.schemas";
import type {
  ObrApprovalFields,
  ObrApprovalState,
} from "./ObrAuthDonePage.models";
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
  const [state, setState] = useState<ObrApprovalState>({ status: "ready" });
  const { register, handleSubmit, formState } = useForm<ObrApprovalFields>({
    resolver: zodResolver(obrApprovalSchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });
  const busy = state.status === "approving" || state.status === "cancelling";
  const finished = state.status === "finished";
  const cancelled = state.status === "cancelled";
  const handoffId = new URLSearchParams(window.location.search).get(
    "handoffId",
  );

  const approvalQuery = useQuery({
    queryKey: authKeys.obrHandoff(handoffId),
    queryFn: () => {
      if (!handoffId) {
        throw new Error("missing-handoff");
      }
      return obrAuthClient.inspectObrHandoff(handoffId);
    },
    enabled: Boolean(handoffId) && !finished && !cancelled,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const approval = approvalQuery.data;
  const failure =
    (state.status === "failed"
      ? state.message
      : cancelled
        ? t("obr.auth.cancelled")
        : null) ??
    (!handoffId || approvalQuery.isError ? t("obr.auth.unavailable") : null);

  async function approve({ code }: ObrApprovalFields) {
    if (!handoffId || !approval || busy || finished || cancelled) {
      return;
    }
    setState({ status: "approving" });
    try {
      await completeObrAuthHandoff(obrAuthClient, {
        handoffId,
        code,
        expectedUserId: approval.user.id,
      });
      setState({ status: "finished" });
    } catch (error) {
      setState({
        status: "failed",
        message: t(
          error instanceof RpgToolsAuthClientError && error.status === 400
            ? "obr.auth.codeMismatch"
            : "obr.auth.unavailable",
        ),
      });
    }
  }
  async function cancel() {
    if (!handoffId || busy) {
      return;
    }
    setState({ status: "cancelling" });
    try {
      await obrAuthClient.rejectObrHandoff(handoffId);
      setState({ status: "cancelled" });
    } catch {
      setState({ status: "failed", message: t("obr.auth.unavailable") });
    }
  }
  return (
    <Wrapper>
      <Stack
        component="form"
        onSubmit={handleSubmit(approve)}
        spacing={2}
        maxWidth={440}
      >
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
                {...register("code")}
                autoComplete="off"
              />
              <Button
                variant="contained"
                type="submit"
                disabled={busy || !formState.isValid}
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
