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

/** A result stamped in yellow, in the sheet's numeral face: `3d6 −1`, `2d4 +1 · melee`. */
export const Formula = styled("div")({
  background: yellow,
  color: black,
  fontFamily: partyFonts.headline,
  fontSize: "2rem",
  lineHeight: 1,
  padding: "6px 12px 4px",
  transform: "rotate(.6deg)",
  maxWidth: "100%",
  overflowWrap: "break-word",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
  "@media (max-width: 520px)": { fontSize: "1.5rem" },
  "@media (prefers-reduced-motion: reduce)": { transform: "none" },
  "&.wrap": { whiteSpace: "normal", fontSize: "1.5rem" },
});

/** A wrapping row of controls. */
export const Controls = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: "14px 20px",
  alignItems: "flex-end",
});

/** A closed card (ability or Class Item): a row button with a tag, a name, chips and Edit. */
export const Summary = styled("button")({
  width: "100%",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  gap: "6px 12px",
  alignItems: "center",
  background: grey,
  border: `2px solid ${partyColors.darkGrey}`,
  color: white,
  padding: "10px 12px",
  minHeight: 56,
  textAlign: "left",
  cursor: "pointer",
  "@media (hover: hover)": { "&:hover": { borderColor: yellow } },
  "&:focus-visible": { outline: `2px solid ${partyColors.yellow}`, outlineOffset: 2 },
});

export const Kind = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  padding: "3px 6px",
  border: `1px solid ${partyColors.yellow}`,
  color: yellow,
  whiteSpace: "nowrap",
  "&.fixed": { background: yellow, color: black },
});

export const Name = styled("span")({
  fontFamily: partyFonts.headline,
  fontSize: "1.5rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: yellow,
  minWidth: 0,
  overflowWrap: "break-word",
  "&.untitled": { color: mutedText },
});

export const Edit = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: mutedText,
});

export const Chips = styled("span")({
  gridColumn: "2 / -1",
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  "&:empty": { display: "none" },
});

export const Chip = styled("span")({
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "2px 7px",
  border: `1px solid ${partyColors.fieldEdge}`,
  color: white,
  "&.missing": { borderColor: pink, color: pink },
});

/** A line that links a grant and its item: what, how often, and a way across. */
export const LinkLine = styled("p")({
  margin: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 10px",
  alignItems: "center",
  background: black,
  border: `1px solid ${partyColors.darkGrey}`,
  padding: "8px 10px",
  fontFamily: partyFonts.label,
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: white,
  "& .odds": { color: yellow },
  "& .badge": { background: yellow, color: black, padding: "2px 6px" },
  "& button": { marginLeft: "auto" },
  "& .muted": { color: mutedText },
});
/** An open card (ability or Class Item), its header, extras row and foot. */
export const OpenCard = styled(Card)({ borderColor: partyColors.yellow });

export const Head = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: 10,
  borderBottom: `2px solid ${partyColors.darkGrey}`,
});

export const Foot = styled("div")({
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: 8,
});

export const Extras = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  borderTop: `1px dashed ${partyColors.darkGrey}`,
  paddingTop: 10,
});
