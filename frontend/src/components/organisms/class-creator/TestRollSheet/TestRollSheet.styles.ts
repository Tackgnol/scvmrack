import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white, grey, darkGrey, blood, mutedText } = partyColors;

export const Sheet = styled("div")({
  background: black,
  color: white,
  border: `2px solid ${darkGrey}`,
  padding: 16,
  fontFamily: partyFonts.body,
  "& h3": { fontFamily: partyFonts.gothic, color: yellow, fontSize: "1.5rem", margin: "0 0 4px", fontWeight: 400 },
  "& ul": { margin: 0, paddingLeft: 18 },
});

export const Micro = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.68rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: mutedText,
});

export const StatRow = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 6,
  margin: "10px 0",
});

export const StatBox = styled("div")({
  background: yellow,
  color: black,
  textAlign: "center",
  padding: "6px 2px",
  "& b": { display: "block", fontFamily: partyFonts.headline, fontSize: "2rem", lineHeight: 1, fontWeight: 400 },
  "& span": { fontFamily: partyFonts.label, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" },
});

export const Chips = styled("div")({ display: "flex", flexWrap: "wrap", gap: 6 });

export const Chip = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  padding: "3px 8px",
  border: `1px solid ${yellow}`,
  color: yellow,
  background: grey,
  "&.hp": { background: blood, borderColor: blood },
});

export const SmallTitle = styled("h4")({
  fontFamily: partyFonts.headline,
  fontSize: "1.2rem",
  textTransform: "uppercase",
  color: yellow,
  margin: "14px 0 4px",
  letterSpacing: "0.03em",
  fontWeight: 400,
});

export const Muted = styled("span")({ color: mutedText });

export const Origin = styled("p")({ margin: 0 });
