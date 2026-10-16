import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const Tray = styled("section")({
  border: `2px dashed ${partyColors.darkGrey}`,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export const Waiting = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 10px",
  alignItems: "center",
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: partyColors.white,
  "& .badge": { background: partyColors.yellow, color: partyColors.black, padding: "2px 6px" },
  "& .name": { fontFamily: partyFonts.headline, fontSize: "1.2rem", letterSpacing: "0.03em" },
  "& button": { marginLeft: "auto" },
});
