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

/** A moderation takedown on the GM's own class: the decision and its reason, loud and plain. */
export const TakenDownNotice = styled("div")({
  marginTop: 10,
  padding: "10px 12px",
  border: `2px solid ${partyColors.pink}`,
  color: partyColors.white,
  fontFamily: partyFonts.body,
  lineHeight: 1.45,
  "& strong": {
    display: "block",
    fontFamily: partyFonts.headline,
    fontWeight: 400,
    fontSize: "1.35rem",
    letterSpacing: "0.04em",
    color: partyColors.pink,
    textTransform: "uppercase",
  },
});
