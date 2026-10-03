import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, black, white, mutedText } = partyColors;

export const Panel = styled("section")({
  background: black,
  color: white,
  border: `3px solid ${black}`,
  boxShadow: `6px 6px 0 ${pink}`,
  padding: 16,
  display: "grid",
  gap: 12,
  "@media (max-width: 600px)": { padding: 12 },
});

export const Head = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "12px 24px",
  paddingBottom: 4,
  "& > div": { flex: "1 1 22em", minWidth: 0 },
  "& h2": {
    fontFamily: partyFonts.headline,
    fontWeight: 400,
    fontSize: "clamp(2rem, 5vw, 2.6rem)",
    lineHeight: 0.95,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: yellow,
    margin: "0 0 6px",
    textWrap: "balance",
  },
});

export const Status = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: mutedText,
  minHeight: "1.4em",
});
