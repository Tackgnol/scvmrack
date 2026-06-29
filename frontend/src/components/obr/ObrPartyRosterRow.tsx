import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WarbandStripRowView } from "@/components/organisms/party/WarbandStripRowView";
import {
  toWarbandMemberFromCard,
  type CompactWarbandCard,
} from "@/components/organisms/party/warbandMember";
import { type ObrPartyRosterCard } from "./useObrRosterCards";

export function ObrPartyRosterRow({ card }: { card: ObrPartyRosterCard }) {
  const { t } = useTranslation();
  const [isModsOpen, setIsModsOpen] = useState(false);
  const member = toWarbandMemberFromCard(card as CompactWarbandCard, {
    armorNone: t("gm.armorNone", "None"),
    unarmed: t("gm.unarmed", "Unarmed"),
    unnamedScvm: t("obr.common.unnamedScvm", "Unnamed scvm"),
    classless: t("obr.common.classless", "Classless"),
  });

  return (
    <WarbandStripRowView
      member={member}
      open={isModsOpen}
      onToggle={() => setIsModsOpen((open) => !open)}
    />
  );
}
