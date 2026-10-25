import { authKeys } from "@/api";
import { signOut } from "@/auth";
import { obrAuthClient } from "@/auth/obrAuthClient";
import { useAuth } from "@/hooks/useAuth";
import { appHistory } from "@/router/history";
import {
  receiveObrSessionTab,
  type ObrTabTransfer,
} from "@tackgnol/rpgtools-shared-auth/client";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wrapper } from "./ObrAuthDonePage.styles";

function destination(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("to") === "class") {
    const id = params.get("classId");
    return id && /^[1-9]\d*$/.test(id) ? `/classes/${id}` : null;
  }
  if (params.get("to") === "forge") {
    const room = params.get("obrRoom");
    const player = params.get("obrPlayer");
    return room && player
      ? `/character/create?${new URLSearchParams({ obrRoom: room, obrPlayer: player })}`
      : null;
  }
  const id = params.get("character");
  return id && /^[a-f0-9-]{36}$/i.test(id) ? `/character/${id}` : null;
}

export function ObrOpenPage() {
  const { t } = useTranslation();
  const { isAnonymous, isLoading, user } = useAuth({
    bootstrapAnonymous: false,
  });
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [target] = useState(destination);
  const [failure, setFailure] = useState(() => !target);
  const [incoming, setIncoming] = useState<ObrTabTransfer | null>(null);
  const [switching, setSwitching] = useState(false);
  const open = useCallback(
    async (transfer: ObrTabTransfer) => {
      await obrAuthClient.redeemObrExchangeToken(
        transfer.token,
        transfer.recipientSecret,
      );
      const session = await obrAuthClient.getSession();
      if (session.user?.id !== transfer.user.id) {
        throw new Error("transfer-identity-mismatch");
      }
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      await appHistory.replace(target!);
    },
    [queryClient, target],
  );

  useEffect(() => {
    if (started.current || isLoading) {
      return;
    }
    started.current = true;
    if (!target) {
      return;
    }
    void receiveObrSessionTab()
      .then(async (transfer) => {
        if (user && !isAnonymous && user.id !== transfer.user.id) {
          setIncoming(transfer);
        } else {
          await open(transfer);
        }
      })
      .catch(() => setFailure(true));
  }, [isAnonymous, isLoading, open, user, target]);

  async function switchAccount() {
    if (!incoming || switching) {
      return;
    }
    setSwitching(true);
    try {
      await signOut();
      await open(incoming);
    } catch {
      setFailure(true);
      setIncoming(null);
    }
    setSwitching(false);
  }
  return (
    <Wrapper>
      <Stack spacing={2}>
        {failure ? (
          <Alert severity="error">{t("obr.auth.transferUnavailable")}</Alert>
        ) : incoming ? (
          <>
            <Typography>
              {t("obr.auth.switchAccount", { name: incoming.user.name })}
            </Typography>
            <Button
              variant="contained"
              disabled={switching}
              onClick={() => void switchAccount()}
            >
              {t("obr.auth.continueAccount", { name: incoming.user.name })}
            </Button>
            <Button
              disabled={switching}
              onClick={() => {
                setIncoming(null);
                setFailure(true);
              }}
            >
              {t("obr.auth.cancel")}
            </Button>
          </>
        ) : (
          <Typography role="status">{t("obr.auth.opening")}</Typography>
        )}
      </Stack>
    </Wrapper>
  );
}
