import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { white } = partyColors;

/** Shared by the form atoms: a labelled field column, its label and its hint line. */
export const Field = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minWidth: 0,
});

const labelText = {
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: white,
} as const;

export const Label = styled("label")(labelText);

/** A field label for a group of controls (no single input to point a <label> at). */
export const Caption = styled("span")(labelText);

export const Hint = styled("p")({
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  fontSize: "0.9rem",
  color: partyColors.mutedText,
  margin: "4px 0 0",
  maxWidth: "34ch",
  lineHeight: 1.4,
});
