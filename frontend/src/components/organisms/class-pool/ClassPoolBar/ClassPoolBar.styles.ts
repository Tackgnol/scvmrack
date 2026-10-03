import { partyColors } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white, grey, darkGrey, mutedText } = partyColors;

export const Bar = styled("div")({
  background: black,
  padding: "8px 0",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  "@media (min-width: 700px)": { position: "sticky", top: 0, zIndex: 3 },
});

export const Search = styled("label")({
  position: "relative",
  flex: "1 1 220px",
  display: "flex",
  "& svg": {
    position: "absolute",
    left: 10,
    top: "50%",
    width: 18,
    height: 18,
    transform: "translateY(-50%)",
    color: mutedText,
    pointerEvents: "none",
  },
  "&:focus-within svg": { color: yellow },
  "& input": {
    flex: 1,
    minHeight: 44,
    background: grey,
    border: `2px solid ${darkGrey}`,
    color: white,
    caretColor: yellow,
    padding: "6px 10px 6px 36px",
    font: "inherit",
  },
  "& input:focus": { borderColor: yellow, outline: "none" },
});

export const Segment = styled("div")({
  display: "inline-flex",
  flexWrap: "wrap",
  border: `1px solid ${yellow}`,
  "& button": { border: 0 },
  "& button + button": { borderLeft: `1px solid ${yellow}` },
});
