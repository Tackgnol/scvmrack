import { partyColors, partyFonts } from "@/theme/partyTokens";
import { Button, TextField, styled } from "@mui/material";

export const EnemyShell = styled("section")({
  display: "grid",
  gap: 10,
  width: "100%",
  boxSizing: "border-box",
  marginTop: 12,
  padding: 12,
  border: `3px solid ${partyColors.black}`,
  background: partyColors.yellow,
  color: partyColors.black,
});

export const EnemyHeader = styled("header")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
});

export const EnemyTitle = styled("h2")({
  margin: 0,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.82rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
});

export const EnemySubhead = styled("p")({
  margin: 0,
  color: partyColors.mutedInk,
  fontFamily: partyFonts.body,
  fontSize: "0.86rem",
  lineHeight: 1.25,
});

export const EnemyList = styled("ul")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 10,
  listStyle: "none",
  margin: 0,
  padding: 0,
});

export const EnemyListItem = styled("li")({
  minWidth: 0,
});

export const EnemyCard = styled("article")({
  minHeight: 124,
  display: "grid",
  gridTemplateRows: "auto auto 1fr",
  gap: 8,
  height: "100%",
  boxSizing: "border-box",
  padding: 12,
  border: `2px solid ${partyColors.black}`,
  background: partyColors.black,
  color: partyColors.white,
  boxShadow: `4px 4px 0 ${partyColors.black}`,
  outline: "none",
  "&:focus-visible": {
    outline: `3px solid ${partyColors.pink}`,
    outlineOffset: 2,
  },
});

export const EnemyCardTop = styled("div")({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
});

export const EnemyName = styled("h3")({
  minWidth: 0,
  margin: 0,
  color: partyColors.yellow,
  fontFamily: partyFonts.gothic,
  fontSize: "1.25rem",
  fontWeight: 400,
  lineHeight: 1.05,
  overflowWrap: "anywhere",
});

export const EnemyStatus = styled("span")<{ $tone: "good" | "warn" | "bad" }>(
  ({ $tone }) => ({
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    minHeight: 24,
    padding: "3px 7px",
    border: `1px solid ${partyColors.black}`,
    background:
      $tone === "good"
        ? partyColors.yellow
        : $tone === "warn"
        ? partyColors.pink
        : partyColors.blood,
    color: $tone === "bad" ? partyColors.yellow : partyColors.black,
    fontFamily: partyFonts.label,
    fontSize: "0.58rem",
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  }),
);

export const EnemyHealthTrack = styled("div")({
  height: 18,
  border: `2px solid ${partyColors.yellow}`,
  background: partyColors.offBlack,
  overflow: "hidden",
});

export const EnemyHealthFill = styled("div")<{ $value: number }>(
  ({ $value }) => ({
    width: `${$value}%`,
    height: "100%",
    background:
      $value <= 25
        ? partyColors.blood
        : $value <= 50
        ? partyColors.pink
        : partyColors.yellow,
    transition: "width 180ms cubic-bezier(0.22, 1, 0.36, 1)",
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  }),
);

export const EnemyMeta = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  color: partyColors.mutedText,
  fontFamily: partyFonts.label,
  fontSize: "0.58rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
});

export const EnemyDetailGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
  gap: 6,
});

export const EnemyDetailBox = styled("div")({
  display: "grid",
  gap: 2,
  padding: "8px 10px",
  border: `1px solid ${partyColors.darkGrey}`,
  background: partyColors.offBlack,
});

export const EnemyDetailLabel = styled("div")({
  color: partyColors.mutedText,
  fontFamily: partyFonts.label,
  fontSize: "0.5rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
});

export const EnemyDetailValue = styled("div")({
  color: partyColors.white,
  fontFamily: partyFonts.body,
  fontSize: "0.9rem",
  lineHeight: 1.2,
  overflowWrap: "anywhere",
});

export const EnemySectionLabel = styled("div")({
  marginBottom: 6,
  color: partyColors.mutedText,
  fontFamily: partyFonts.label,
  fontSize: "0.55rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
});

export const EnemyEntryList = styled("ul")({
  display: "grid",
  gap: 5,
  listStyle: "none",
  margin: 0,
  padding: 0,
});

export const EnemyEntryRow = styled("li")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
  padding: "7px 9px",
  border: `1px solid ${partyColors.darkGrey}`,
  background: partyColors.offBlack,
});

export const EnemyEntryName = styled("span")({
  minWidth: 0,
  color: partyColors.white,
  fontFamily: partyFonts.body,
  fontSize: "0.9rem",
  lineHeight: 1.2,
  overflowWrap: "anywhere",
});

export const EnemyEntryValue = styled("span")({
  flex: "0 0 auto",
  color: partyColors.yellow,
  fontFamily: partyFonts.label,
  fontSize: "0.62rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

export const EnemyEntryDescription = styled("div")({
  marginTop: 2,
  color: partyColors.afflictionText,
  fontFamily: partyFonts.body,
  fontSize: "0.84rem",
  lineHeight: 1.3,
  overflowWrap: "anywhere",
});

export const EnemyVisibleDescription = styled("p")({
  margin: 0,
  paddingTop: 8,
  borderTop: `1px solid ${partyColors.darkGrey}`,
  color: partyColors.afflictionText,
  fontFamily: partyFonts.body,
  fontSize: "0.88rem",
  fontStyle: "italic",
  lineHeight: 1.4,
});

export const EmptyEnemies = styled("div")({
  minHeight: 96,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px dashed ${partyColors.black}`,
  color: partyColors.black,
  padding: 14,
  textAlign: "center",
  fontFamily: partyFonts.label,
  fontSize: "0.8rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1.2,
  textTransform: "uppercase",
});

export const EnemyGatePanel = styled("div")({
  minHeight: 122,
  display: "grid",
  alignContent: "center",
  justifyItems: "start",
  gap: 8,
  border: `2px dashed ${partyColors.black}`,
  background: partyColors.yellow,
  color: partyColors.black,
  padding: 14,
});

export const EnemyGateTitle = styled("h3")({
  margin: 0,
  color: partyColors.black,
  fontFamily: partyFonts.label,
  fontSize: "0.86rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: "uppercase",
});

export const EnemyGateText = styled("p")({
  maxWidth: "52ch",
  margin: 0,
  color: partyColors.mutedInk,
  fontFamily: partyFonts.body,
  fontSize: "0.92rem",
  lineHeight: 1.3,
});

export const EnemyGateActions = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  paddingTop: 4,
});

export const EnemyActionRow = styled("div")({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  paddingTop: 8,
  borderTop: `1px solid ${partyColors.darkGrey}`,
});

export const EnemyButton = styled(Button)({
  minHeight: 30,
  border: `2px solid ${partyColors.black}`,
  borderRadius: 0,
  background: partyColors.black,
  color: partyColors.yellow,
  fontFamily: partyFonts.label,
  fontSize: "0.58rem",
  fontWeight: 900,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "5px 9px",
  textTransform: "uppercase",
  "&:hover": {
    background: partyColors.pink,
    color: partyColors.black,
  },
  "&:disabled": {
    opacity: 0.55,
  },
}) as typeof Button;

export const EnemyDangerButton = styled(EnemyButton)({
  borderColor: partyColors.blood,
  color: partyColors.debuff,
  "&:hover": {
    background: partyColors.blood,
    color: partyColors.yellow,
  },
}) as typeof Button;

export const EnemyFormPanel = styled("form")({
  display: "grid",
  gap: 10,
  padding: 12,
  border: `3px solid ${partyColors.black}`,
  background: partyColors.black,
  color: partyColors.white,
  boxShadow: `5px 5px 0 ${partyColors.pink}`,
});

export const EnemyFormGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
});

export const EnemyStatusRows = styled("div")({
  display: "grid",
  gap: 8,
});

export const EnemyDynamicRows = styled("div")({
  display: "grid",
  gap: 7,
});

export const EnemyDynamicRow = styled("div")({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(96px, 0.85fr) auto",
  gap: 6,
  alignItems: "start",
  "@media (max-width: 520px)": {
    gridTemplateColumns: "1fr",
  },
});

export const EnemyStatusRow = styled("div")({
  display: "grid",
  gridTemplateColumns: "82px minmax(0, 1fr) auto",
  gap: 6,
  alignItems: "start",
});

export const EnemyTextField = styled(TextField)({
  "& .MuiInputBase-root": {
    backgroundColor: partyColors.offBlack,
    borderRadius: 0,
    color: partyColors.white,
    fontFamily: partyFonts.body,
  },
  "& .MuiInputBase-input": {
    color: partyColors.white,
    caretColor: partyColors.yellow,
  },
  "& .MuiInputBase-input::placeholder": {
    color: partyColors.mutedText,
    opacity: 1,
  },
  "& .MuiInputLabel-root": {
    color: partyColors.yellow,
    fontFamily: partyFonts.label,
    fontSize: "0.76rem",
    fontWeight: 900,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: partyColors.darkGrey,
    borderWidth: 2,
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: partyColors.yellow,
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: partyColors.pink,
  },
  "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
    borderColor: partyColors.pink,
  },
  "& .MuiFormHelperText-root": {
    color: partyColors.yellow,
    fontFamily: partyFonts.label,
    fontSize: "0.62rem",
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.15,
    marginLeft: 0,
    textTransform: "uppercase",
  },
  "& .MuiFormHelperText-root.Mui-error": {
    color: partyColors.pink,
  },
}) as typeof TextField;

export const EnemyFormActions = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  paddingTop: 4,
});
