import { partyColors } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const Row = styled("div")({
  background: partyColors.black,
  border: `2px solid ${partyColors.darkGrey}`,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

export const Controls = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "14px 20px",
  alignItems: "flex-end",
});
