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
  alignItems: "center",
  justifyContent: "center",
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
