import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white } = partyColors;

export const Group = styled("div")({ display: "flex", flexWrap: "wrap", gap: 6 });

export const Die = styled("button")({
  minWidth: 50,
  minHeight: 50,
  padding: "0 8px",
  background: "transparent",
  color: white,
  border: `2px solid ${partyColors.fieldEdge}`,
  fontFamily: partyFonts.headline,
  fontSize: "1.5rem",
  cursor: "pointer",
  fontVariantNumeric: "tabular-nums",
  "@media (hover: hover)": {
    "&:hover": { borderColor: yellow, color: yellow },
  },
  '&[aria-checked="true"]': {
    background: yellow,
    color: black,
    borderColor: yellow,
    transform: "rotate(-1.5deg)",
  },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 3 },
  "@media (max-width: 520px)": { minWidth: 44, minHeight: 44, fontSize: "1.2rem", padding: "0 4px" },
  "@media (prefers-reduced-motion: reduce)": { '&[aria-checked="true"]': { transform: "none" } },
});
