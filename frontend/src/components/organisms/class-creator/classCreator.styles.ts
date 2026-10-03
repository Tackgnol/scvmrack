import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, black, white, grey, darkGrey, mutedText } = partyColors;

export const Stack = styled("div")({ display: "flex", flexDirection: "column", gap: 12 });

/** A card that lifts a tone off the black paper. */
export const Card = styled("div")({
  background: grey,
  border: `2px solid ${darkGrey}`,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

/** A heading inside a card (the subtitle level). */
export const GroupHeading = styled("h3")({
  fontFamily: partyFonts.headline,
  fontWeight: 400,
  fontSize: "1.2rem",
  letterSpacing: "0.04em",
  color: white,
  margin: 0,
});

export const Hint = styled("p")({
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: mutedText,
  margin: 0,
  maxWidth: "36em",
});

export const Spread = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 12px",
  alignItems: "center",
  justifyContent: "space-between",
});

export const Counter = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  color: mutedText,
  fontVariantNumeric: "tabular-nums",
});

export const Empty = styled("div")({
  border: `2px dashed ${darkGrey}`,
  padding: 16,
  textAlign: "center",
  color: mutedText,
  fontStyle: "italic",
  fontFamily: partyFonts.body,
});

/** The heavy action button on the black paper (yellow ink on black). */
export const InkButton = styled("button")({
  fontFamily: partyFonts.headline,
  fontSize: "1.2rem",
  textTransform: "uppercase",
  background: black,
  color: yellow,
  border: `2px solid ${yellow}`,
  padding: "8px 16px",
  minHeight: 44,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  boxShadow: `3px 3px 0 ${black}`,
  "& svg": { width: 18, height: 18 },
  "@media (hover: hover)": { "&:hover:not(:disabled)": { color: white, borderColor: white } },
  "&:disabled": { color: mutedText, borderColor: darkGrey, borderStyle: "dashed", cursor: "not-allowed" },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 3 },
});

/** A small text action (Remove, Fix…). */
export const SmallAction = styled("button")({
  fontFamily: partyFonts.label,
  fontSize: "0.72rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  background: "transparent",
  color: yellow,
  border: `1px solid ${yellow}`,
  padding: "4px 12px",
  minHeight: 36,
  cursor: "pointer",
  "@media (hover: hover)": { "&:hover": { background: yellow, color: black } },
  "&.kill": { background: partyColors.blood, borderColor: partyColors.blood },
  "@media (pointer: coarse)": { minHeight: 44 },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 2 },
});

/** The one pink interrupt: a blocking message. */
export const Interrupt = styled("p")({
  background: pink,
  color: black,
  border: `2px solid ${black}`,
  padding: "8px 10px",
  margin: 0,
  fontFamily: partyFonts.body,
  fontSize: "0.95rem",
  "&.quiet": { background: "transparent", color: white, borderColor: white },
});

export const ZineContact = styled("p")({
  borderTop: `1px solid ${darkGrey}`,
  paddingTop: 12,
  margin: "4px 0 0",
  fontFamily: partyFonts.body,
  fontStyle: "italic",
  color: mutedText,
  "& a": { color: yellow, textUnderlineOffset: 3 },
  "& a:hover": { color: white },
});
