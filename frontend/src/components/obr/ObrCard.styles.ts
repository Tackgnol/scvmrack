import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const CardShell = styled("main")({
  minHeight: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflow: "auto",
  background: partyColors.yellow,
  color: partyColors.black,
  padding: 8,
  fontFamily: partyFonts.label,
});

export const StatusFrame = styled("article")({
  minHeight: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  boxSizing: "border-box",
  border: `3px solid ${partyColors.black}`,
  background: partyColors.black,
  color: partyColors.yellow,
  padding: 18,
  textAlign: "center",
  fontFamily: partyFonts.label,
  fontSize: "0.95rem",
  fontWeight: 900,
  letterSpacing: 0,
  textTransform: "uppercase",
});

export const StatusButton = styled("button")({
  minHeight: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px solid ${partyColors.yellow}`,
  background: partyColors.black,
  color: partyColors.yellow,
  cursor: "pointer",
  fontFamily: partyFonts.label,
  fontSize: "0.72rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "6px 12px",
  textTransform: "uppercase",
  "&:hover:not(:disabled)": {
    background: partyColors.pink,
    borderColor: partyColors.pink,
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
