import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

// Mirrors the roster row's binding-controls language (flat borders, no
// radii, pink accent rail) from ObrPartyRoster.styles.ts — no new visual
// vocabulary is introduced here.
export const BindingControlsShell = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 6,
  borderLeft: `4px solid ${partyColors.pink}`,
  paddingLeft: 8,
});

export const BindingRow = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 6,
  minWidth: 0,
});

export const BindingLabel = styled("span")({
  maxWidth: "100%",
  minHeight: 24,
  display: "inline-flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  border: `2px solid ${partyColors.black}`,
  background: partyColors.yellow,
  color: partyColors.black,
  padding: "3px 6px",
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
  overflowWrap: "anywhere",
});

export const StaleBadge = styled("strong")({
  color: partyColors.yellow,
  background: partyColors.blood,
  border: `2px solid ${partyColors.black}`,
  padding: "1px 4px",
  fontFamily: partyFonts.label,
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
});

export const BindingButton = styled("button")({
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

export const BindingSelect = styled("select")({
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
