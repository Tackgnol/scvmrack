import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, black, white, mutedText } = partyColors;

export const Tally = styled("p")({
  flex: "none",
  display: "grid",
  gridTemplateColumns: "auto auto",
  gap: "0 12px",
  alignItems: "end",
  margin: 0,
});

export const Big = styled("span")({
  fontFamily: partyFonts.headline,
  fontSize: "4.4rem",
  lineHeight: 0.8,
  color: black,
  background: yellow,
  padding: "8px 10px 2px",
  transform: "rotate(-2deg)",
  boxShadow: `4px 4px 0 ${pink}`,
  "&.zero": { background: pink },
  "@media (max-width: 600px)": { fontSize: "3.4rem" },
});

export const Parts = styled("span")({
  display: "grid",
  gap: 1,
  fontFamily: partyFonts.label,
  fontSize: "0.72rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: mutedText,
  "& b": { fontWeight: 400, color: white },
  "& .lead": { color: yellow, fontSize: "0.8rem" },
});
