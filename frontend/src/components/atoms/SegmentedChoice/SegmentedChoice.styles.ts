import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white, darkGrey } = partyColors;

export const Segments = styled("div")({
  display: "inline-flex",
  flexWrap: "wrap",
  maxWidth: "100%",
  border: `1px solid ${yellow}`,
  "@media (max-width: 520px)": {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
    width: "100%",
  },
});

export const Segment = styled("button")({
  fontFamily: partyFonts.label,
  fontSize: "0.72rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  background: black,
  color: white,
  border: 0,
  padding: "4px 14px",
  minHeight: 50,
  cursor: "pointer",
  "& + &": { borderLeft: `1px solid ${yellow}` },
  // Mouse-only hover: a sticky touch hover must never leave black text on black.
  "@media (hover: hover)": { "&:hover:not(:disabled)": { background: yellow, color: black } },
  '&[aria-checked="true"]': { background: yellow, color: black },
  "&:disabled": {
    color: partyColors.mutedText,
    background: "transparent",
    textDecoration: "line-through",
    cursor: "not-allowed",
  },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 3, position: "relative" },
  "@media (max-width: 520px)": { "& + &": { borderLeft: 0 }, boxShadow: `0 0 0 1px ${darkGrey}` },
});
