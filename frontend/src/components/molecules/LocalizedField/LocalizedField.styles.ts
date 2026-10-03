import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, pink, white, black } = partyColors;

export const Head = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 4,
});

const fieldStyles = {
  width: "100%",
  minHeight: 44,
  background: black,
  color: white,
  border: `2px solid ${partyColors.fieldEdge}`,
  padding: "8px 10px",
  fontFamily: partyFonts.body,
  fontSize: "1rem",
  caretColor: yellow,
  "@media (hover: hover)": { "&:hover": { borderColor: white } },
  "&:focus": { outline: "none", borderColor: yellow, boxShadow: `0 0 0 3px ${black}, 0 0 0 5px ${white}` },
  '&[aria-invalid="true"]': { borderColor: pink, borderStyle: "dashed" },
} as const;

export const Input = styled("input")(fieldStyles);

export const TextArea = styled("textarea")({
  ...fieldStyles,
  minHeight: 88,
  resize: "vertical",
  fieldSizing: "content",
  maxHeight: "24em",
});

const note = {
  display: "block",
  marginTop: 4,
  fontFamily: partyFonts.label,
  fontSize: "0.65rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
} as const;

export const Missing = styled("span")({ ...note, color: pink });

export const Count = styled("span")({ ...note, color: partyColors.mutedText, "&.over": { color: pink } });
