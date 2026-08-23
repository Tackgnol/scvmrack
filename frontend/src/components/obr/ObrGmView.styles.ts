import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

export const GmShell = styled("div")({
  minHeight: "100%",
  width: "100%",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: 10,
  padding: 8,
  background: partyColors.yellow,
  color: partyColors.black,
  fontFamily: partyFonts.label,
});

export const GmTabList = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
});

export const GmTab = styled("button")<{ $active: boolean }>(
  ({ $active }) => ({
    minWidth: 0,
    minHeight: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: `3px solid ${partyColors.black}`,
    background: $active ? partyColors.black : partyColors.yellow,
    color: $active ? partyColors.yellow : partyColors.black,
    boxShadow: $active
      ? `4px 4px 0 ${partyColors.pink}`
      : `2px 2px 0 ${partyColors.black}`,
    cursor: "pointer",
    fontFamily: partyFonts.label,
    fontSize: "0.78rem",
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    padding: "8px 10px",
    textTransform: "uppercase",
    transition:
      "transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms cubic-bezier(0.22, 1, 0.36, 1), color 160ms cubic-bezier(0.22, 1, 0.36, 1)",
    whiteSpace: "nowrap",
    "&:hover": {
      background: $active ? partyColors.black : partyColors.pink,
      color: $active ? partyColors.yellow : partyColors.black,
      transform: "translate(-1px, -1px)",
      boxShadow: $active
        ? `5px 5px 0 ${partyColors.pink}`
        : `3px 3px 0 ${partyColors.black}`,
    },
    "&:active": {
      transform: "translate(0, 0)",
      boxShadow: `1px 1px 0 ${partyColors.black}`,
    },
    "&:focus-visible": {
      outline: `3px solid ${partyColors.pink}`,
      outlineOffset: 2,
    },
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  }),
);

export const GmTabPanel = styled("div")({
  minWidth: 0,
  "&[hidden]": {
    display: "none",
  },
});
