import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const ClassDescription = styled("p")({
  margin: "6px 0 0",
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: partyColors.blurbText,
  maxWidth: "60ch",
});

export const ZineLine = styled("p")({
  margin: 0,
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: partyColors.mutedInk,
  "& a": { color: partyColors.black, textUnderlineOffset: 3 },
});
