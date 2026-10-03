import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, white, darkGrey, mutedText } = partyColors;

export const Group = styled("div")({
  borderTop: `3px solid ${darkGrey}`,
  marginTop: 6,
});

export const Header = styled("button")({
  width: "100%",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
  alignItems: "baseline",
  gap: "4px 16px",
  background: "none",
  border: 0,
  color: white,
  padding: "18px 4px 10px",
  cursor: "pointer",
  minHeight: 44,
  textAlign: "left",
  "& .title": {
    fontFamily: partyFonts.headline,
    fontSize: "2rem",
    lineHeight: 1,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: yellow,
  },
  "&:hover .title": { color: white },
  "& .desc": {
    fontFamily: partyFonts.body,
    fontStyle: "italic",
    color: mutedText,
    minWidth: 0,
  },
  "& .fraction": {
    fontFamily: partyFonts.headline,
    fontSize: "1.6rem",
    lineHeight: 1,
    color: white,
    whiteSpace: "nowrap",
  },
  "& .fraction.none": { color: mutedText },
  "& .fraction .of": { color: mutedText },
  "& .fraction small": {
    fontFamily: partyFonts.label,
    fontSize: "0.65rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: mutedText,
    marginLeft: 4,
  },
  "& svg": {
    alignSelf: "center",
    color: yellow,
    transition: "transform .12s",
  },
  '&[aria-expanded="true"] svg': { transform: "rotate(180deg)" },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 2 },
  "@media (max-width: 700px)": {
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    "& .title": { fontSize: "1.6rem" },
    "& .desc": { gridColumn: "1 / -1", gridRow: 2 },
  },
});

export const Rows = styled("div")({ paddingBottom: 8 });
