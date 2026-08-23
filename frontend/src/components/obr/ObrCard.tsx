import OBR from "@owlbear-rodeo/sdk";
import {
  fetchObrCards,
  type ObrCard,
  type ObrLocale,
} from "@/api/obr";
import { useQuery } from "@tanstack/react-query";
import { WarbandCardView } from "@/components/organisms/party/WarbandCardView";
import {
  toWarbandMemberFromCard,
  type CompactWarbandCard,
} from "@/components/organisms/party/warbandMember";
import { getApiLocale } from "@/hooks/utils";
import { SCVM_CARD_POPOVER_ID } from "@/obr/contextMenu";
import { unbindCharacterFromToken } from "@tackgnol/rpgtools-owlbear";
import { scvmrackObrExtension } from "@/obr/extension";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { CardShell, StatusButton, StatusFrame } from "./ObrCard.styles";

export type ObrCardCharacter = ObrCard;

type ObrCardRouteProps = {
  characterId?: string | null;
  roomId?: string | null;
  tokenId?: string | null;
};

type ObrCardProps = {
  card: ObrCardCharacter | null;
  error?: string | null;
  isLoading?: boolean;
  action?: {
    label: string;
    busyLabel: string;
    onClick: () => Promise<void>;
  } | null;
};

export function ObrCardRoute({
  characterId = getObrCardCharacterId(),
  roomId = getObrCardRoomId(),
  tokenId = getObrCardTokenId(),
}: ObrCardRouteProps) {
  const { i18n, t } = useTranslation();
  const [role, setRole] = useState<"GM" | "PLAYER" | null>(null);
  const locale = getApiLocale<ObrLocale>(i18n.language);
  const ids = characterId?.trim() ?? "";
  const room = roomId?.trim() ?? "";
  const token = tokenId?.trim() ?? "";
  const {
    data: cardQueryData,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["obr", "cards", room, ids, locale],
    queryFn: () => fetchObrCards([ids], room, locale),
    enabled: ids.length > 0 && room.length > 0,
  });
  const cards = cardQueryData as ObrCardCharacter[] | undefined;
  const card = cards?.[0] ?? null;
  const canUnbind = role === "GM" && token.length > 0;

  useEffect(() => {
    let active = true;
    if (!token) {
      return () => {
        active = false;
      };
    }

    void OBR.player
      .getRole()
      .then((nextRole) => {
        if (active) {
          setRole(nextRole);
        }
      })
      .catch(() => {
        if (active) {
          setRole(null);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleUnbind() {
    if (!token) return;

    try {
      await unbindCharacterFromToken(scvmrackObrExtension, OBR, token);
      await Promise.all([
        showNotification(t("obr.card.unboundToken", "Token unbound"), "SUCCESS"),
        OBR.popover.close(SCVM_CARD_POPOVER_ID),
      ]);
    } catch {
      await showNotification(
        t("obr.card.unbindFailed", "Could not unbind token"),
        "ERROR",
      );
    }
  }

  const notFoundAction =
    canUnbind && ids && !card && !isLoading && !isFetching && !isError
      ? {
          label: t("obr.card.unbindToken", "Unbind token"),
          busyLabel: t("obr.card.unbindingToken", "Unbinding"),
          onClick: handleUnbind,
        }
      : null;

  if (!ids) {
    return <ObrCard card={null} error={t("obr.card.missingId", "Missing scvm id")} />;
  }

  if (isLoading || isFetching) {
    return <ObrCard card={null} isLoading />;
  }

  if (isError) {
    return <ObrCard card={null} error={t("obr.card.loadFailed", "Could not load scvm")} />;
  }

  return (
    <ObrCard
      card={card}
      error={card ? null : t("obr.card.notFound", "Scvm not found")}
      action={notFoundAction}
    />
  );
}

export function ObrCard({
  card,
  error = null,
  isLoading = false,
  action = null,
}: ObrCardProps) {
  const { t } = useTranslation();
  const [isActionBusy, setIsActionBusy] = useState(false);

  async function handleAction() {
    if (!action) return;

    setIsActionBusy(true);
    await action.onClick().finally(() => {
      setIsActionBusy(false);
    });
  }

  if (isLoading) {
    return (
      <CardShell>
        <StatusFrame role="status">
          {t("obr.card.loading", "Loading scvm")}
        </StatusFrame>
      </CardShell>
    );
  }

  if (error || !card) {
    return (
      <CardShell>
        <StatusFrame role="status">
          <span>{error ?? t("obr.card.notFound", "Scvm not found")}</span>
          {action && (
            <StatusButton
              type="button"
              disabled={isActionBusy}
              onClick={() => void handleAction()}
            >
              {isActionBusy ? action.busyLabel : action.label}
            </StatusButton>
          )}
        </StatusFrame>
      </CardShell>
    );
  }

  const member = toWarbandMemberFromCard(card as CompactWarbandCard, {
    armorNone: t("gm.armorNone", "None"),
    unarmed: t("gm.unarmed", "Unarmed"),
    unnamedScvm: t("obr.common.unnamedScvm", "Unnamed scvm"),
    classless: t("obr.common.classless", "Classless"),
  });

  return (
    <CardShell>
      <WarbandCardView member={member} />
    </CardShell>
  );
}

function getObrCardCharacterId(search = window.location.search): string | null {
  const id = new URLSearchParams(search).get("id")?.trim();
  return id ? id : null;
}

function getObrCardRoomId(search = window.location.search): string | null {
  const room = new URLSearchParams(search).get("room")?.trim();
  return room ? room : null;
}

function getObrCardTokenId(search = window.location.search): string | null {
  const token = new URLSearchParams(search).get("token")?.trim();
  return token ? token : null;
}

async function showNotification(
  message: string,
  variant: "SUCCESS" | "ERROR",
): Promise<void> {
  try {
    await OBR.notification.show(message, variant);
  } catch {
    // The scene mutation is authoritative; notification delivery is best-effort.
  }
}
