import { partyColors } from "@/theme/partyTokens";
import { WarbandStripRow } from "@/components/organisms/party/WarbandStripRow";
import type { WarbandMember } from "@/components/organisms/party/warbandMember";
import type { PartyMember } from "@/hooks/useParty";
import { styled } from "@mui/material";
import type { ReactNode } from "react";

type WarbandVitalStripProps = {
  members: PartyMember[];
  /** Gate per-row detail fetches (true while the GM overview is on screen). */
  active?: boolean;
  renderActions?: (member: WarbandMember) => ReactNode;
};

const StripList = styled("ul")(({ theme }) => ({
  position: "relative",
  background: partyColors.yellow,
  border: `1px solid ${partyColors.black}`,
  padding: "14px",
  [theme.breakpoints.up("sm")]: { padding: "26px" },
  margin: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
}));

const StripItem = styled("li")({
  listStyle: "none",
});

// The "C · Vital Strip" layout: the warband as a stack of full-width strips on the
// signature yellow page, each one tappable to expand. Built for a tablet at the table.
export function WarbandVitalStrip({
  members,
  active = true,
  renderActions,
}: WarbandVitalStripProps) {
  return (
    <StripList role="list" data-testid="vital-strip">
      {members.map((member) => (
        <StripItem key={member.id}>
          <WarbandStripRow
            id={member.id}
            name={member.name}
            disconnected={member.disconnected}
            changed={member.changed}
            active={active}
            renderActions={renderActions}
          />
        </StripItem>
      ))}
    </StripList>
  );
}
