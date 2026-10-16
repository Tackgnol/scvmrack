import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { keyframes } from "@mui/system";

const { yellow, pink, black } = partyColors;

const press = keyframes`
  from { transform: scale(1.18) rotate(-3deg); }
  to { transform: rotate(-2deg); }
`;

export const Forged = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "12px 18px",
  alignItems: "center",
  background: yellow,
  color: black,
  border: `3px solid ${black}`,
  boxShadow: `6px 6px 0 ${pink}`,
  padding: "14px 16px",
  "& b": {
    fontFamily: partyFonts.headline,
    fontSize: "3rem",
    lineHeight: 0.9,
    textTransform: "uppercase",
    fontWeight: 400,
    display: "inline-block",
    transform: "rotate(-2deg)",
    animation: `${press} 260ms cubic-bezier(0.16,1,0.3,1) both`,
  },
  "& span": {
    fontFamily: partyFonts.label,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    maxWidth: "40ch",
  },
  "& a": {
    fontFamily: partyFonts.headline,
    fontSize: "1.2rem",
    textTransform: "uppercase",
    background: black,
    color: yellow,
    border: `2px solid ${black}`,
    padding: "8px 16px",
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  "& a:focus-visible": { outline: `2px solid ${black}`, outlineOffset: 3 },
  "@media (prefers-reduced-motion: reduce)": { "& b": { animation: "none" } },
});
