import { Link } from "@tanstack/react-router";
import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, white, mutedText } = partyColors;

export const Meta = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 8px",
  alignItems: "center",
});

export const ReportLink = styled(Link)({
  color: yellow,
  fontFamily: partyFonts.label,
  fontSize: "0.65rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  textUnderlineOffset: 3,
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 2 },
});

/** The class shape: numeral cells, then the rule and who plays it. */
export const Shape = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, auto)",
  gap: "2px 16px",
  justifyContent: "end",
  textAlign: "right",
  fontFamily: partyFonts.label,
  fontSize: "0.66rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: mutedText,
  "& .stat": { display: "grid", justifyItems: "end", lineHeight: 1.1 },
  "& .stat b": {
    fontFamily: partyFonts.headline,
    fontWeight: 400,
    fontSize: "1.7rem",
    lineHeight: 1,
    letterSpacing: "0.02em",
    color: white,
  },
  ".off & .stat b": { color: partyColors.offText },
  "& .rule": { gridColumn: "1 / -1", fontSize: "0.7rem" },
  "& .playing": { gridColumn: "1 / -1", color: yellow, fontSize: "0.7rem" },
  "@media (max-width: 700px)": {
    gridColumn: 2,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: "2px 12px",
    justifyContent: "start",
    textAlign: "left",
    "& .stat": { display: "flex", gap: 4, alignItems: "baseline" },
    "& .stat b": { fontSize: "1.3rem" },
  },
});
