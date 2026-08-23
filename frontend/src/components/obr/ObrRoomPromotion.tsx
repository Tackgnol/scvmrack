import OBR from "@owlbear-rodeo/sdk";
import { useTranslation } from "react-i18next";
import { useObrRoomParty, usePromoteObrRoom } from "@/hooks/usePartyRepository";
import { ObrRoomAttach } from "./ObrRoomAttach";
import {
  PromotionButton,
  PromotionCopyButton,
  PromotionError,
  PromotionLink,
  PromotionLinks,
  PromotionPanel,
} from "./ObrPartyRoster.styles";

export function ObrRoomPromotion() {
  const { t } = useTranslation();
  const roomId = OBR.room.id;
  const promotedRoom = useObrRoomParty(roomId);
  const promoteRoom = usePromoteObrRoom();
  const party = promotedRoom.data ?? promoteRoom.data;

  async function copyInvite(invitePath: string | undefined) {
    if (!invitePath) {
      return;
    }

    const inviteUrl = toAbsoluteInviteUrl(invitePath);
    try {
      await writeClipboardText(inviteUrl);
      await showObrNotification(
        t("obr.roster.inviteCopied", "Invite link copied"),
        "SUCCESS",
      );
    } catch {
      await showObrNotification(
        t("obr.roster.copyInviteFailed", "Could not copy invite link"),
        "ERROR",
      );
    }
  }

  if (party) {
    return (
      <PromotionPanel aria-label="Room promotion">
        {party.invitePath ? (
          <PromotionLinks aria-label="Saved party links">
            <PromotionCopyButton
              type="button"
              title={toAbsoluteInviteUrl(party.invitePath)}
              aria-label={t(
                "obr.roster.copyInviteLink",
                "Copy invite link {{path}}",
                { path: party.invitePath },
              )}
              onClick={() => void copyInvite(party.invitePath)}
            >
              {t("obr.roster.inviteLink", "Invite {{path}}", {
                path: party.invitePath,
              })}
            </PromotionCopyButton>
            <PromotionLink
              href={`/party/${party.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("obr.roster.manageLink", "Manage in scvmrack")}
            </PromotionLink>
          </PromotionLinks>
        ) : (
          <PromotionLinks aria-label="Saved party links">
            {t("obr.roster.roomBoardActive", "Room board active")}
            {" — "}
            {t(
              "obr.roster.signInForInvite",
              "Sign in as the owner to manage invites",
            )}
          </PromotionLinks>
        )}
      </PromotionPanel>
    );
  }

  const promotedPartyName = t(
    "obr.roster.promotedPartyName",
    "Owlbear room party",
  );

  return (
    <PromotionPanel aria-label="Room promotion">
      <PromotionButton
        disabled={promoteRoom.isPending}
        type="button"
        onClick={() =>
          promoteRoom.mutate({
            obrRoomId: roomId,
            name: promotedPartyName,
          })
        }
      >
        {promoteRoom.isPending
          ? t("obr.roster.moving", "Moving")
          : t("obr.roster.moveParty", "Move party to scvmrack")}
      </PromotionButton>
      {promoteRoom.isError && (
        <PromotionError role="alert">
          {promotionErrorMessage(
            promoteRoom.error,
            t(
              "obr.roster.promoteError",
              "Could not save this Owlbear room party",
            ),
          )}
        </PromotionError>
      )}
      <ObrRoomAttach roomId={roomId} />
    </PromotionPanel>
  );
}

function promotionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toAbsoluteInviteUrl(invitePath: string): string {
  if (typeof window === "undefined") {
    return invitePath;
  }

  return new URL(invitePath, window.location.origin).toString();
}

async function writeClipboardText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

async function showObrNotification(
  message: string,
  variant: "SUCCESS" | "ERROR",
): Promise<void> {
  try {
    await OBR.notification.show(message, variant);
  } catch {
    // Clipboard already did or did not work; notification failure should not
    // turn the button into a broken control.
  }
}
