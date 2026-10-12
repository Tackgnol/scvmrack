import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { Hint } from "../classCreator.styles";
import { keyframes } from "@mui/system";

const { yellow, black, white, grey } = partyColors;

const thump = keyframes`
  from { transform: scale(1.18) rotate(-3deg); }
  to { transform: rotate(-0.4deg); }
`;

export const Layout = styled("div")({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 20,
  "@media (min-width: 880px)": { gridTemplateColumns: "250px minmax(0, 1fr)" },
});

export const Head = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
});

export const StepTitle = styled("h2")({
  display: "inline-block",
  background: yellow,
  color: black,
  border: `3px solid ${black}`,
  boxShadow: `4px 4px 0 ${black}`,
  fontFamily: partyFonts.headline,
  fontSize: "2rem",
  lineHeight: 1,
  padding: "4px 12px 2px",
  textTransform: "uppercase",
  transform: "rotate(-0.4deg)",
  margin: 0,
  fontWeight: 400,
  animation: `${thump} 260ms cubic-bezier(0.16,1,0.3,1) both`,
  "&:focus": { outline: "none" },
  "@media (prefers-reduced-motion: reduce)": { animation: "none", transform: "none" },
});

export const StepCount = styled("span")({
  display: "none",
  marginLeft: 12,
  color: black,
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  "@media (max-width: 879px)": { display: "inline" },
});

export const Paper = styled("div")({
  background: black,
  color: white,
  border: `1px solid ${grey}`,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 20,
  "@media (max-width: 600px)": { padding: 12 },
});

export const Nav = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 20,
  flexWrap: "wrap",
});

const navButton = {
  fontFamily: partyFonts.headline,
  fontSize: "1.2rem",
  textTransform: "uppercase",
  padding: "8px 16px",
  minHeight: 44,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  "& svg": { width: 18, height: 18 },
  "&:focus-visible": { outline: `2px solid ${black}`, outlineOffset: 3 },
} as const;

export const BackButton = styled("button")({
  ...navButton,
  background: "transparent",
  color: black,
  border: `2px solid ${black}`,
  "@media (hover: hover)": { "&:hover": { textDecoration: "underline", textUnderlineOffset: 4 } },
});

export const NextButton = styled("button")({
  ...navButton,
  marginLeft: "auto",
  background: black,
  color: yellow,
  border: `2px solid ${black}`,
  boxShadow: `3px 3px 0 ${black}`,
  "@media (hover: hover)": { "&:hover": { color: white } },
});

export const DraftStatus = styled("p")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: "4px 12px",
  margin: "6px 0 0",
  color: black,
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
});

export const DiscardDraft = styled("button")({
  background: "none",
  border: 0,
  padding: 0,
  color: black,
  font: "inherit",
  letterSpacing: "inherit",
  textTransform: "inherit",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
  "&:focus-visible": { outline: `2px solid ${black}`, outlineOffset: 2 },
});

export const PaperFoot = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderTop: `1px solid ${grey}`,
  paddingTop: 16,
});

export const History = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
});

export const ConflictPanel = styled("section")({
  background: partyColors.pink,
  color: black,
  border: `3px solid ${black}`,
  boxShadow: `4px 4px 0 ${black}`,
  padding: 16,
  marginBottom: 20,
  display: "grid",
  gap: 12,
  fontFamily: partyFonts.body,
  "& strong": { fontFamily: partyFonts.headline, fontSize: "1.5rem", textTransform: "uppercase" },
  "& p": { margin: 0 },
  "& .choices": { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  "& .choices > div": { display: "grid", alignContent: "start", gap: 6 },
  "@media (max-width: 600px)": { "& .choices": { gridTemplateColumns: "1fr" } },
});

export const ConflictAction = styled("button")({
  fontFamily: partyFonts.label,
  fontSize: "0.8rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  background: black,
  color: partyColors.pink,
  border: `2px solid ${black}`,
  minHeight: 44,
  padding: "8px 12px",
  cursor: "pointer",
  justifySelf: "start",
  "@media (hover: hover)": { "&:hover": { background: partyColors.pink, color: black } },
  "&:focus-visible": { outline: `2px solid ${black}`, outlineOffset: 3 },
});

export const ShortcutHint = styled(Hint)({
  "@media (hover: none)": { display: "none" },
});
