import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const ZineLine = styled("p")({
  margin: 0,
  maxWidth: "65ch",
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: partyColors.mutedInk,
  "& a": { color: partyColors.black, textUnderlineOffset: 3 },
});
