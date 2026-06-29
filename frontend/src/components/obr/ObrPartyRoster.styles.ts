import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const RosterShell = styled("main")({
  minHeight: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflow: "auto",
  background: partyColors.yellow,
  color: partyColors.black,
  padding: 8,
  fontFamily: partyFonts.label,
});

export const RosterHeader = styled("header")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minHeight: 30,
  padding: "0 2px 8px",
  "@media (max-width: 700px)": {
    alignItems: "stretch",
    flexDirection: "column",
  },
});

export const RosterTitle = styled("h1")({
  margin: 0,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.82rem",
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: 0,
  textTransform: "uppercase",
});

export const PromotionPanel = styled("section")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  minWidth: 0,
  fontFamily: partyFonts.label,
  "@media (max-width: 700px)": {
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
});

export const PromotionButton = styled("button")({
  minHeight: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px solid ${partyColors.black}`,
  background: partyColors.black,
  color: partyColors.yellow,
  cursor: "pointer",
  fontFamily: partyFonts.label,
  fontSize: "0.68rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "5px 10px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  "&:hover:not(:disabled)": {
    background: partyColors.pink,
    color: partyColors.black,
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.55,
  },
  "&:focus-visible": {
    outline: `3px solid ${partyColors.pink}`,
    outlineOffset: 2,
  },
});

export const PromotionNote = styled("span")({
  minWidth: 0,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.68rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1.15,
  textTransform: "uppercase",
  overflowWrap: "anywhere",
});

export const PromotionError = styled(PromotionNote)({
  color: partyColors.blood,
});

export const PromotionLinks = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  minWidth: 0,
  flexWrap: "wrap",
});

export const PromotionLink = styled("a")({
  maxWidth: 190,
  minHeight: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  border: `2px solid ${partyColors.black}`,
  background: partyColors.yellow,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.66rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "5px 8px",
  textDecoration: "none",
  textTransform: "uppercase",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  "&:hover": {
    background: partyColors.pink,
    color: partyColors.black,
  },
  "&:focus-visible": {
    outline: `3px solid ${partyColors.pink}`,
    outlineOffset: 2,
  },
});

export const RosterList = styled("ul")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: 12,
  listStyle: "none",
  margin: 0,
  padding: 14,
  border: `3px solid ${partyColors.black}`,
  background: partyColors.yellow,
  [theme.breakpoints.up("sm")]: {
    padding: 18,
  },
}));

export const RosterEmpty = styled("div")({
  minHeight: 150,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `3px solid ${partyColors.black}`,
  background: partyColors.black,
  color: partyColors.yellow,
  padding: 18,
  textAlign: "center",
  fontFamily: partyFonts.label,
  fontSize: "1rem",
  fontWeight: 900,
  letterSpacing: 0,
  textTransform: "uppercase",
});
