import OBR from "@owlbear-rodeo/sdk";
import { useTranslation } from "react-i18next";
import { useObrSession } from "@/hooks/useObrSession";
import { usePromoteObrRoom } from "@/hooks/usePartyRepository";
import {
  PromotionButton,
  PromotionError,
  PromotionLink,
  PromotionLinks,
  PromotionPanel,
} from "./ObrPartyRoster.styles";

export function ObrRoomPromotion() {
  const { t } = useTranslation();
  const { isAuthenticated } = useObrSession();
  const promoteRoom = usePromoteObrRoom();
  const party = promoteRoom.data;

  if (!isAuthenticated) {
    return null;
  }

  if (party) {
    return (
      <PromotionPanel aria-label="Room promotion">
        <PromotionLinks aria-label="Saved party links">
          <PromotionLink
            href={party.invitePath}
            target="_blank"
            rel="noreferrer"
          >
            {t("obr.roster.inviteLink", "Invite {{path}}", {
              path: party.invitePath,
            })}
          </PromotionLink>
          <PromotionLink
            href={`/party/${party.id}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("obr.roster.manageLink", "Manage in scvmrack")}
          </PromotionLink>
        </PromotionLinks>
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
            obrRoomId: OBR.room.id,
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
    </PromotionPanel>
  );
}

function promotionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
