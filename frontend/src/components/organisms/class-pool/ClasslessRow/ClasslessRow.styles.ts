import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { Row } from "../classPool.styles";

/** Classless sits apart, above the groups. */
export const ClasslessShell = styled(Row)({
  borderTop: 0,
  borderBottom: `3px solid ${partyColors.darkGrey}`,
  gridTemplateColumns: "auto minmax(0, 1fr)",
  "& .class-name": {
    fontFamily: partyFonts.headline,
    fontSize: "1.6rem",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
});
