import SaveIcon from "@mui/icons-material/Save";
import { type ReactElement, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useObrRoomParty, usePromoteObrRoom } from "@/hooks/usePartyRepository";
import {
  EnemyButton,
  EnemyGateActions,
  EnemyGatePanel,
  EnemyGateText,
  EnemyGateTitle,
  EnemyHeader,
  EnemyShell,
  EnemySubhead,
  EnemyTitle,
} from "../ObrEnemies.styles";
import { enemyGateErrorMessage } from "./enemyErrorMessage";

type ObrEnemyGmGateProps = {
  roomId: string;
  children: () => ReactElement;
};

export function ObrEnemyGmGate({ roomId, children }: ObrEnemyGmGateProps) {
  const { t } = useTranslation();
  const promotedRoom = useObrRoomParty(roomId);
  const promoteRoom = usePromoteObrRoom();
  const setupStartedForRoom = useRef<string | null>(null);
  const {
    data: promotedParty,
    error: promoteError,
    isError: isPromoteError,
    isPending: isPromotePending,
    mutate: promote,
  } = promoteRoom;

  const party = promotedRoom.data ?? promotedParty ?? null;
  const promotedPartyName = t(
    "obr.roster.promotedPartyName",
    "Owlbear room party",
  );

  useEffect(() => {
    if (party || isPromotePending || isPromoteError) {
      return;
    }

    if (setupStartedForRoom.current === roomId) {
      return;
    }

    setupStartedForRoom.current = roomId;
    promote({
      obrRoomId: roomId,
      name: promotedPartyName,
    });
  }, [
    isPromoteError,
    isPromotePending,
    party,
    promote,
    promotedPartyName,
    roomId,
  ]);

  if (!party) {
    const isSetupFailed = isPromoteError;

    return (
      <EnemyGate
        title={
          isSetupFailed
            ? t("obr.enemies.roomSetupFailedTitle", "Enemy board setup failed")
            : t("obr.enemies.roomSetupTitle", "Setting up enemy board")
        }
        body={t(
          "obr.enemies.roomSetupBody",
          "Scvmrack is preparing this Owlbear room for enemy sheets. No login is needed.",
        )}
        error={
          isSetupFailed
            ? enemyGateErrorMessage(
                promoteError,
                t(
                  "obr.roster.promoteError",
                  "Could not save this Owlbear room party",
                ),
                t,
              )
            : null
        }
        action={
          isSetupFailed ? (
            <EnemyButton
              type="button"
              disabled={isPromotePending}
              onClick={() =>
                promote({
                  obrRoomId: roomId,
                  name: promotedPartyName,
                })
              }
              startIcon={<SaveIcon />}
            >
              {isPromotePending
                ? t("obr.enemies.roomSetupPending", "Setting up")
                : t("obr.enemies.roomSetupRetry", "Retry setup")}
            </EnemyButton>
          ) : null
        }
      />
    );
  }

  return children();
}

function EnemyGate({
  title,
  body,
  action = null,
  error = null,
}: {
  title: string;
  body: string;
  action?: ReactElement | null;
  error?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <EnemyShell aria-label={t("obr.enemies.gmRegion", "GM enemies")}>
      <EnemyHeader>
        <div>
          <EnemyTitle>
            {t("obr.enemies.gmTitle", "GM enemies {{count}}", { count: 0 })}
          </EnemyTitle>
          <EnemySubhead>
            {t("obr.enemies.gmSubhead", "Table threats")}
          </EnemySubhead>
        </div>
      </EnemyHeader>
      <EnemyGatePanel role="status">
        <EnemyGateTitle>{title}</EnemyGateTitle>
        <EnemyGateText>{body}</EnemyGateText>
        {action && <EnemyGateActions>{action}</EnemyGateActions>}
        {error && <EnemyGateText role="alert">{error}</EnemyGateText>}
      </EnemyGatePanel>
    </EnemyShell>
  );
}
