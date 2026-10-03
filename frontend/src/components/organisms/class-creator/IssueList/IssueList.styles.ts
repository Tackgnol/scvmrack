import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white, grey } = partyColors;

export const List = styled("ul")({ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 });

export const FixButton = styled("button")({
  width: "100%",
  textAlign: "left",
  background: grey,
  color: white,
  padding: "8px 10px",
  minHeight: 44,
  border: `2px solid ${black}`,
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  "& .message": { fontFamily: partyFonts.body, fontSize: "0.95rem" },
  "& .fix": {
    whiteSpace: "nowrap",
    border: `1px solid ${yellow}`,
    color: yellow,
    padding: "2px 8px",
    fontFamily: partyFonts.label,
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  "@media (hover: hover)": { "&:hover": { borderColor: yellow } },
  "&:hover .fix, &:focus-visible .fix": { background: yellow, color: black },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 2 },
});

export const Ready = styled("div")({
  background: yellow,
  color: black,
  border: `2px solid ${black}`,
  padding: "10px 12px",
  fontFamily: partyFonts.label,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontSize: "0.75rem",
});
