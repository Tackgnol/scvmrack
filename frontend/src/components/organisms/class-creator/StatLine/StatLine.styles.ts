import { partyColors, partyFonts } from "@/theme/partyTokens";
import { statColors } from "@/theme/morkBorgTheme";
import { styled } from "@mui/material";

const { white, grey, darkGrey, mutedText } = partyColors;

export const Line = styled("section")({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 14,
  background: grey,
  border: `2px solid ${darkGrey}`,
  padding: 14,
  alignItems: "center",
  "@media (min-width: 1080px)": { gridTemplateColumns: "84px minmax(0, 1fr) 230px" },
});

export const StatName = styled("div")({
  fontFamily: partyFonts.headline,
  fontSize: "2rem",
  lineHeight: 1,
  color: white,
  padding: "10px 8px",
  textAlign: "center",
  letterSpacing: "0.04em",
  minWidth: 84,
  alignSelf: "start",
  "&.strength": { background: statColors.str },
  "&.agility": { background: statColors.agi },
  "&.presence": { background: statColors.pre },
  "&.toughness": { background: statColors.tou },
  "@media (max-width: 520px)": { fontSize: "1.5rem", minWidth: 64, padding: "8px 6px" },
});

export const Controls = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "14px 20px",
  alignItems: "flex-end",
  "@media (max-width: 1079px)": { gridColumn: "1 / -1", gridRow: 2 },
});

export const Result = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "flex-start",
  "@media (max-width: 1079px)": { gridColumn: 2, gridRow: 1 },
  "@media (min-width: 1080px)": { alignItems: "flex-end", textAlign: "right" },
});


export const Range = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  whiteSpace: "nowrap",
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: mutedText,
  fontVariantNumeric: "tabular-nums",
});
