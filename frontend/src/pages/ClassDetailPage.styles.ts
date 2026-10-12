import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const Sheet = styled("div")({
  color: partyColors.black,
  fontFamily: partyFonts.body,
  "& ol": { margin: "8px 0 0", paddingLeft: 24, lineHeight: 1.5 },
});

export const SectionHeading = styled("h2")({
  margin: 0,
  fontFamily: partyFonts.headline,
  fontWeight: 400,
  fontSize: "1.9rem",
  letterSpacing: "0.04em",
  lineHeight: 1,
  textTransform: "uppercase",
  color: partyColors.black,
});
