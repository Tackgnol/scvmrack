import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const ModerationCard = styled("section")({
  background: partyColors.black,
  color: partyColors.white,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `5px 5px 0 ${partyColors.pink}`,
  padding: 16,
});

/** The serious-category flag: it must stop the moderator before anything else on the card. */
export const AuthorityStamp = styled("p")({
  display: "inline-block",
  width: "fit-content",
  margin: 0,
  background: partyColors.pink,
  color: partyColors.black,
  border: `3px solid ${partyColors.black}`,
  boxShadow: `4px 4px 0 ${partyColors.yellow}`,
  fontFamily: partyFonts.headline,
  fontSize: "1.6rem",
  lineHeight: 1,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  padding: "10px 16px 8px",
  transform: "rotate(-1.5deg)",
});
