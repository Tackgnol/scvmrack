import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const RosterBindingButton = styled("button")({
  minHeight: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px solid ${partyColors.black}`,
  background: partyColors.black,
  color: partyColors.yellow,
  cursor: "pointer",
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "4px 7px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  "&:hover:not(:disabled)": {
    background: partyColors.pink,
    color: partyColors.black,
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.55,
  },
  "&:focus-visible": {
    outline: `3px solid ${partyColors.pink}`,
    outlineOffset: 2,
  },
});

export const RosterBindingSelect = styled("select")({
  minHeight: 28,
  maxWidth: 180,
  border: `2px solid ${partyColors.black}`,
  background: partyColors.yellow,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "4px 6px",
  textTransform: "uppercase",
});
