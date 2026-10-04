import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";

const { yellow, black, white } = partyColors;

export const NativeSelect = styled("select")({
  width: "100%",
  minHeight: 44,
  background: black,
  color: white,
  border: `2px solid ${partyColors.fieldEdge}`,
  padding: "8px 10px",
  fontFamily: partyFonts.body,
  fontSize: "1rem",
  "@media (hover: hover)": { "&:hover": { borderColor: white } },
  "&:focus": { outline: "none", borderColor: yellow },
});
