import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, black, white, grey, darkGrey, mutedText } = partyColors;

export const RailWrap = styled("nav")({
  "@media (min-width: 880px)": { position: "sticky", top: 12, alignSelf: "start" },
});

export const Rail = styled("ol")({
  display: "flex",
  gap: 8,
  overflowX: "auto",
  padding: "6px 10px 12px 6px",
  listStyle: "none",
  margin: 0,
  scrollSnapType: "x proximity",
  "& li": { flex: "0 0 auto", scrollSnapAlign: "start" },
  "@media (min-width: 880px)": { flexDirection: "column", overflow: "visible", padding: 0 },
});

export const StepButton = styled("button")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  width: "100%",
  minWidth: 180,
  minHeight: 44,
  background: black,
  color: white,
  border: `3px solid ${grey}`,
  padding: "8px 10px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: partyFonts.gothic,
  fontSize: "1.2rem",
  boxShadow: `2px 2px 0 ${black}`,
  "& .n": { fontFamily: partyFonts.headline, color: mutedText, marginRight: 6 },
  "@media (hover: hover)": { "&:hover": { borderColor: white } },
  '&[aria-current="step"]': { borderColor: yellow, color: yellow, boxShadow: `4px 4px 0 ${black}`, transform: "rotate(-1deg)" },
  '&[aria-current="step"] .n': { color: yellow },
  "&:focus-visible": { outline: `2px solid ${black}`, outlineOffset: 2 },
  "@media (prefers-reduced-motion: reduce)": { '&[aria-current="step"]': { transform: "none" } },
});

export const Status = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  padding: "3px 8px",
  border: `1px solid ${darkGrey}`,
  color: yellow,
  "&.warn": { background: pink, color: black, borderColor: pink },
  "&.warn.quiet": { background: "transparent", color: white, borderColor: white },
  "&.empty": { color: white, borderStyle: "dashed", borderColor: white },
});
