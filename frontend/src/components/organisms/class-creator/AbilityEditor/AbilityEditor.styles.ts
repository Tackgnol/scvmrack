import { partyColors } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { Card } from "../classCreator.styles";

export const OpenCard = styled(Card)({ borderColor: partyColors.yellow });

export const Head = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: 10,
  borderBottom: `2px solid ${partyColors.darkGrey}`,
});

export const Foot = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: 8,
});

export const Extras = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  borderTop: `1px dashed ${partyColors.darkGrey}`,
  paddingTop: 10,
});
