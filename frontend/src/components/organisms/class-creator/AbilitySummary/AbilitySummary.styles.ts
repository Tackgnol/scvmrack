import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white, grey, darkGrey, pink, mutedText } = partyColors;


export const Summary = styled("button")({
  width: "100%",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: "6px 12px",
  alignItems: "center",
  background: grey,
  border: `2px solid ${darkGrey}`,
  color: white,
  padding: "10px 12px",
  minHeight: 56,
  textAlign: "left",
  cursor: "pointer",
  "@media (hover: hover)": { "&:hover": { borderColor: yellow } },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 2 },
});

export const Kind = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  padding: "3px 6px",
  border: `1px solid ${yellow}`,
  color: yellow,
  whiteSpace: "nowrap",
  "&.fixed": { background: yellow, color: black },
});

export const Name = styled("span")({
  fontFamily: partyFonts.headline,
  fontSize: "1.5rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: yellow,
  minWidth: 0,
  overflowWrap: "break-word",
  "&.untitled": { color: mutedText },
});

export const Edit = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: mutedText,
});

export const Chips = styled("span")({
  gridColumn: "2 / -1",
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  "&:empty": { display: "none" },
});

export const Chip = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "2px 7px",
  border: `1px solid ${partyColors.fieldEdge}`,
  color: white,
  "&.missing": { borderColor: pink, color: pink },
});
