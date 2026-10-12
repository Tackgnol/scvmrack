import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { Link } from "@tanstack/react-router";

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

export const ReportLink = styled(Link)({
  fontFamily: partyFonts.label,
  fontSize: "0.8rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: partyColors.black,
  textDecorationThickness: 2,
  textUnderlineOffset: 4,
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  "&:focus-visible": { outline: `2px solid ${partyColors.black}`, outlineOffset: 3 },
});
