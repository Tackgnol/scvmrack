import { obrOpenDestination } from "./ObrOpenPage.utils";
import { discardObrSession } from "@/auth/discardObrSession";
import {
  tabSessionSnapshot,
  confirmTabSession,
  isTabSessionUnverified,
  subscribeTabSession,
} from "@/utils/tabSession";
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
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";
import { ObrAuthWrapper } from "./obrAuth.styles";

export function ObrOpenPage() {
  const { t } = useTranslation();
  const { isAnonymous, isLoading, user } = useAuth({
    bootstrapAnonymous: false,
  });
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [target] = useState(() => obrOpenDestination(window.location.search));
  const [failure, setFailure] = useState(() => !target);
  const [incoming, setIncoming] = useState<ObrTabTransfer | null>(null);
  const [switching, setSwitching] = useState(false);
  const unverified = useSyncExternalStore(
    subscribeTabSession,
    isTabSessionUnverified,
    () => false,
  );
  const open = useCallback(
    async (transfer: ObrTabTransfer) => {
      const previousToken = tabSessionSnapshot();
      let redeemed = false;
      try {
        await obrAuthClient.redeemObrExchangeToken(
          transfer.token,
          transfer.recipientSecret,
        );
        redeemed = true;
        const session = await obrAuthClient.getSession();
        if (session.user?.id !== transfer.user.id) {
          throw new Error("transfer-identity-mismatch");
        }
      } catch (error) {
        if (redeemed || tabSessionSnapshot() !== previousToken) {
          await discardObrSession(queryClient);
        }
        throw error;
      }
      confirmTabSession();
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      if (target) {
        await appHistory.replace(target);
      }
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
    <ObrAuthWrapper>
      <Stack spacing={2}>
        {failure ? (
          <>
            <Alert severity="error">{t("obr.auth.transferUnavailable")}</Alert>
            {unverified && (
              <Button
                disabled={switching}
                onClick={async () => {
                  setSwitching(true);
                  try {
                    await discardObrSession(queryClient);
                  } catch {
                    setFailure(true);
                  }
                  setSwitching(false);
                }}
              >
                {t("obr.auth.retrySignOut")}
              </Button>
            )}
          </>
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
    </ObrAuthWrapper>
  );
}
