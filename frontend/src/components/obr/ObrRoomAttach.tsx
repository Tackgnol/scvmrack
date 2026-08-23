import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttachObrRoom, usePartyList } from "@/hooks/usePartyRepository";
import {
  PromotionButton,
  PromotionError,
  PromotionLinks,
  RosterBindingSelect,
} from "./ObrPartyRoster.styles";

// Portability D2: a GM whose room died picks a warband and re-points it here.
export function ObrRoomAttach({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const parties = usePartyList();
  const attach = useAttachObrRoom();
  const [partyId, setPartyId] = useState("");

  // Anonymous callers get a 401 from GET /api/parties — hide the section.
  if (!parties.data || parties.data.length === 0) {
    return null;
  }

  return (
    <PromotionLinks aria-label="Attach existing warband">
      <RosterBindingSelect
        aria-label={t("obr.roster.attachSelect", "Use an existing warband")}
        value={partyId}
        onChange={(event) => setPartyId(event.target.value)}
      >
        <option value="">
          {t("obr.roster.attachSelect", "Use an existing warband")}
        </option>
        {parties.data.map((party) => (
          <option key={party.id} value={party.id}>
            {party.name}
          </option>
        ))}
      </RosterBindingSelect>
      <PromotionButton
        type="button"
        disabled={!partyId || attach.isPending}
        onClick={() => attach.mutate({ partyId, obrRoomId: roomId })}
      >
        {attach.isPending
          ? t("obr.roster.attaching", "Attaching")
          : t("obr.roster.useThisRoom", "Use this room")}
      </PromotionButton>
      {attach.isError && (
        <PromotionError role="alert">
          {attach.error instanceof Error && attach.error.message
            ? attach.error.message
            : t("obr.roster.attachError", "Could not attach this room")}
        </PromotionError>
      )}
    </PromotionLinks>
  );
}
