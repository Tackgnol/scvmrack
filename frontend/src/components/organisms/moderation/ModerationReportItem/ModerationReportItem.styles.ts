import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const Consequences = styled("ul")({
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 4,
  fontFamily: partyFonts.body,
  fontSize: "0.9rem",
  lineHeight: 1.4,
  color: partyColors.mutedText,
  maxWidth: "65ch",
  "& strong": { color: partyColors.white },
});
