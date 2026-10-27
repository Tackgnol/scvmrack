import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, black, grey, darkGrey, mutedText } = partyColors;

export const Line = styled("section")({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: "12px 14px",
  background: grey,
  border: `2px solid ${darkGrey}`,
  padding: 10,
  alignItems: "center",
  "&.open": { borderColor: yellow },
  "@media (max-width: 520px)": { gridTemplateColumns: "auto minmax(0, 1fr)" },
});

export const StatName = styled("div")({
  fontFamily: partyFonts.headline,
  fontSize: "1.6rem",
  lineHeight: 1,
  color: yellow,
  background: black,
  border: `1px solid ${pink}`,
  padding: "8px 6px",
  textAlign: "center",
  letterSpacing: "0.04em",
  minWidth: 72,
  "@media (max-width: 520px)": { fontSize: "1.35rem", minWidth: 56 },
});

export const Result = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "6px 14px",
});

export const Range = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  whiteSpace: "nowrap",
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: mutedText,
  fontVariantNumeric: "tabular-nums",
});

export const Tail = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 10,
  "@media (max-width: 520px)": { gridColumn: "1 / -1", justifyContent: "space-between" },
});

export const BookTag = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.7rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: mutedText,
  border: `1px dashed ${mutedText}`,
  padding: "3px 8px",
  whiteSpace: "nowrap",
});

export const Controls = styled("div")({
  gridColumn: "1 / -1",
  display: "flex",
  flexWrap: "wrap",
  gap: "14px 20px",
  alignItems: "flex-end",
  borderTop: `1px solid ${darkGrey}`,
  paddingTop: 12,
});
