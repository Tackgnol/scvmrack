import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { usePartyLimits } from "@/hooks/usePartyRepository";
import { ObrPartyRosterRow } from "./ObrPartyRosterRow";
import { ObrRoomPromotion } from "./ObrRoomPromotion";
import {
  type ObrPartyRosterCard,
  useObrRosterCards,
} from "./useObrRosterCards";
import {
  RosterEmpty,
  RosterHeader,
  RosterList,
  RosterShell,
  RosterTitle,
} from "./ObrPartyRoster.styles";

type ObrPartyRosterProps = {
  cards?: ObrPartyRosterCard[];
  maxMembers?: number;
};

const FALLBACK_MAX_MEMBERS = 10;

export function ObrPartyRoster({ cards, maxMembers }: ObrPartyRosterProps) {
  if (cards) {
    return (
      <ObrPartyRosterView
        cards={cards}
        maxMembers={maxMembers ?? FALLBACK_MAX_MEMBERS}
      />
    );
  }

  return <ObrPartyRosterContainer />;
}

function ObrPartyRosterContainer() {
  const cards = useObrRosterCards();
  const limits = usePartyLimits();
  return (
    <ObrPartyRosterView
      cards={cards}
      maxMembers={limits.data?.maxMembers ?? FALLBACK_MAX_MEMBERS}
      promotion={<ObrRoomPromotion />}
    />
  );
}

function ObrPartyRosterView({
  cards,
  maxMembers,
  promotion = null,
}: {
  cards: ObrPartyRosterCard[];
  maxMembers: number;
  promotion?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <RosterShell aria-label="GM party roster">
      <RosterHeader>
        <RosterTitle>
          {t("obr.roster.title", "GM · OVERVIEW {{count}}/{{max}}", {
            count: cards.length,
            max: maxMembers,
          })}
        </RosterTitle>
        {promotion}
      </RosterHeader>

      {cards.length > 0 ? (
        <RosterList aria-label="Bound scvm cards">
          {cards.map((card, index) => (
            <ObrPartyRosterRow
              key={card.id ?? `${card.name ?? "scvm"}-${index}`}
              card={card}
            />
          ))}
        </RosterList>
      ) : (
        <RosterEmpty role="status">
          {t(
            "obr.roster.empty",
            "No bound scvm yet. Players must bind a scvm to a token.",
          )}
        </RosterEmpty>
      )}
    </RosterShell>
  );
}
