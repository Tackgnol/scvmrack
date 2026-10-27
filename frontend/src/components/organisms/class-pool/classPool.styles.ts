import { partyColors, partyFonts } from "@/theme/partyTokens";
import { customStyles } from "@/theme/morkBorgTheme";
import { styled } from "@mui/material";

const { yellow, pink, black, white, darkGrey, mutedText } = partyColors;

export const ActButton = styled("button")({
  fontFamily: partyFonts.label,
  fontSize: "0.72rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  background: "transparent",
  color: yellow,
  border: `1px solid ${yellow}`,
  padding: "4px 10px",
  minHeight: 36,
  cursor: "pointer",
  '&:hover, &[aria-pressed="true"]': { background: yellow, color: black },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 2 },
  "@media (pointer: coarse)": { minHeight: 44 },
});

export const Chip = styled("span")({
  display: "inline-block",
  fontFamily: partyFonts.label,
  fontSize: "0.65rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  padding: "2px 7px",
  border: `1px solid ${darkGrey}`,
  color: white,
  whiteSpace: "nowrap",
});

export const Attr = styled("span")({
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: mutedText,
  fontSize: "0.9rem",
});

export const Hint = styled("p")({
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: mutedText,
  margin: 0,
  maxWidth: "36em",
});

export const Notice = styled("div")({
  background: pink,
  color: black,
  border: `2px solid ${black}`,
  padding: "10px 12px",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 12px",
  alignItems: "center",
  justifyContent: "space-between",
  fontFamily: partyFonts.body,
  "& p": { margin: 0, maxWidth: "60ch" },
  "& button": { color: black, borderColor: black },
  "& button:hover": { background: black, color: pink },
});

export const ClassName = styled("span")({
  ...customStyles.inheritedLinks,
  fontFamily: partyFonts.gothic,
  fontSize: "1.35rem",
  lineHeight: 1.2,
  color: white,
  transition: "color .12s",
  "& a:hover": { color: yellow },
});

export const Blurb = styled("span")({
  fontFamily: partyFonts.body,
  color: partyColors.blurbText,
  fontSize: "0.9rem",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
});

/** A pool row: switch, who the class is, and (for classes) its shape. Dimmed when off. */
export const Row = styled("div")({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: "4px 18px",
  alignItems: "center",
  padding: "10px 8px",
  borderTop: `1px solid ${partyColors.grey}`,
  "&:hover, &:focus-within": { background: partyColors.offBlack },
  "&:hover .class-info, &:focus-within .class-info": { display: "block" },
  "@media (hover: none)": { "&:hover .class-info": { display: "none" } },
  "&.card-dismissed .class-info": { display: "none" },
  "&.off .class-name": { color: partyColors.offText },
  "&.off .class-blurb": { color: partyColors.offBlurb },
  "@media (max-width: 700px)": {
    gridTemplateColumns: "auto minmax(0, 1fr)",
    padding: "10px 4px",
  },
});

export const Who = styled("div")({
  display: "grid",
  gap: 3,
  minWidth: 0,
});
