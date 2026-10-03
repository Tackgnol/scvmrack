import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, darkGrey, white } = partyColors;

export const Row = styled("div")({ display: "inline-flex", alignItems: "stretch" });

export const StepButton = styled("button")({
  width: 44,
  minHeight: 50,
  background: "transparent",
  border: `2px solid ${yellow}`,
  color: yellow,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  padding: 0,
  "& svg": { width: 16, height: 16 },
  "&:hover": { background: yellow, color: black },
  "&:disabled": {
    borderStyle: "dashed",
    borderColor: darkGrey,
    color: partyColors.fieldEdge,
    background: "transparent",
    cursor: "not-allowed",
  },
});

export const Stamp = styled("input")({
  width: 64,
  minHeight: 50,
  padding: 0,
  background: yellow,
  color: black,
  border: `2px solid ${yellow}`,
  borderInline: 0,
  fontFamily: partyFonts.headline,
  fontSize: "2rem",
  lineHeight: 1,
  textAlign: "center",
  caretColor: black,
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 3, boxShadow: `0 0 0 5px ${white}` },
  "@media (max-width: 520px)": { width: 52, minHeight: 46, fontSize: "1.5rem" },
});
