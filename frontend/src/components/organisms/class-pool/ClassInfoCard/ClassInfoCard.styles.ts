import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, black, white, grey } = partyColors;

/** Hidden until its row is hovered or focused; see ClassPoolRow.styles. */
export const Card = styled("div")({
  position: "absolute",
  zIndex: 4,
  left: 100,
  top: "calc(100% - 2px)",
  width: "min(400px, calc(100vw - 60px))",
  background: grey,
  border: `2px solid ${yellow}`,
  boxShadow: `6px 6px 0 ${pink}`,
  display: "none",
  color: white,
  "&::before": {
    content: '""',
    position: "absolute",
    left: 18,
    top: -11,
    border: "9px solid transparent",
    borderTop: 0,
    borderBottom: `10px solid ${yellow}`,
  },
  "@media (max-width: 700px)": { left: 4 },
});

export const Strip = styled("div")({
  background: yellow,
  color: black,
  padding: "6px 12px 4px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 10,
  "& .name": { fontFamily: partyFonts.gothic, fontSize: "1.35rem" },
  "& .source": {
    fontFamily: partyFonts.label,
    fontSize: "0.65rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
});

export const Body = styled("div")({
  padding: "10px 12px 12px",
  display: "grid",
  gap: 8,
  fontFamily: partyFonts.body,
  "& > p": { margin: 0, fontStyle: "italic" },
  "& dl": {
    margin: 0,
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "3px 12px",
    fontSize: "0.9rem",
  },
  "& dt": {
    fontFamily: partyFonts.label,
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: pink,
    paddingTop: 3,
  },
  "& dd": { margin: 0 },
});
