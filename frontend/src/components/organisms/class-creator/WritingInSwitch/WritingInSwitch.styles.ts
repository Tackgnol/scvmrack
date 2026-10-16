import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { pink, black, yellow, white } = partyColors;

export const Wrap = styled("div")({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" });

export const Caption = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: black,
});

export const Option = styled("button")({
  fontFamily: partyFonts.label,
  fontSize: "0.72rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  background: "transparent",
  color: black,
  border: `1px solid ${black}`,
  padding: "4px 12px",
  minHeight: 44,
  cursor: "pointer",
  '&[aria-checked="true"]': { background: black, color: yellow },
  "@media (hover: hover)": { "&:hover": { background: black, color: yellow } },
  "& .missing": { display: "inline-block", marginLeft: 6, background: pink, color: black, padding: "0 5px" },
  "& .missing.quiet": { background: "transparent", color: "inherit", border: `1px solid currentColor` },
  "&:focus-visible": { outline: `2px solid ${black}`, outlineOffset: 2, boxShadow: `0 0 0 4px ${white}` },
});
