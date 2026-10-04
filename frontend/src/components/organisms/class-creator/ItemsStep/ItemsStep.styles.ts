import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const Gate = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 14,
  border: `2px dashed ${partyColors.darkGrey}`,
  padding: 20,
  "& h3": {
    margin: 0,
    fontFamily: partyFonts.headline,
    fontSize: "2rem",
    fontWeight: 400,
    lineHeight: 1,
    color: partyColors.yellow,
    textTransform: "uppercase",
    textWrap: "balance",
  },
  "& p": { margin: 0, maxWidth: "62ch", fontFamily: partyFonts.body },
});

export const GateNo = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
  "& p": { margin: 0, fontStyle: "italic", color: partyColors.mutedText, fontFamily: partyFonts.body },
});
