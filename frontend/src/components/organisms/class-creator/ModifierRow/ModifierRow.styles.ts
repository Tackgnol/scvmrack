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
