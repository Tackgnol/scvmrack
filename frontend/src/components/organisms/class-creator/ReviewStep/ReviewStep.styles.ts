import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import d20 from "@/assets/D20.svg";

const { yellow, black, white } = partyColors;

export const Columns = styled("div")({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 20,
  "@media (min-width: 1040px)": { gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, .9fr)" },
});

export const SaveButton = styled("button")({
  fontFamily: partyFonts.headline,
  fontSize: "1.2rem",
  textTransform: "uppercase",
  background: yellow,
  color: black,
  border: `2px solid ${black}`,
  padding: "8px 16px",
  minHeight: 44,
  cursor: "pointer",
  alignSelf: "flex-start",
  boxShadow: `3px 3px 0 ${black}`,
  "@media (hover: hover)": { "&:hover:not(:disabled)": { background: white } },
  "&.needs-fixes": { background: "transparent", color: yellow, borderColor: yellow, boxShadow: "none" },
  "&.needs-fixes:hover:not(:disabled)": { background: partyColors.grey },
  "&:disabled": { background: "transparent", color: partyColors.mutedText, border: `2px dashed ${partyColors.darkGrey}`, boxShadow: "none", cursor: "default" },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 3 },
});

/** The house d20, masked so it takes the button's text colour (yellow, white on hover, grey when disabled). */
export const DieIcon = styled("span")({
  display: "inline-block",
  width: 22,
  height: 22,
  flexShrink: 0,
  backgroundColor: "currentColor",
  mask: `url(${d20}) center / contain no-repeat`,
  WebkitMask: `url(${d20}) center / contain no-repeat`,
});
