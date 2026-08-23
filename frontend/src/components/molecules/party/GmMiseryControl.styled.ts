import { partyColors, partyFonts } from "@/theme/partyTokens";
import { Alert, Button, styled } from "@mui/material";

export const GmMiseryControlRoot = styled("div")(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(1.5),
}));

export const GmMiseryControlAction = styled(Button)(({ theme }) => ({
  width: "100%",
  minHeight: 44,
  paddingInline: 16,
  color: partyColors.black,
  background: partyColors.pink,
  border: `2px solid ${partyColors.yellow}`,
  borderRadius: 0,
  fontFamily: partyFonts.label,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  "&:hover": {
    background: partyColors.yellow,
  },
  "&:disabled": {
    color: partyColors.mutedText,
    background: partyColors.offBlack,
    borderColor: partyColors.mutedText,
  },
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

export const GmMiseryControlNotice = styled(Alert)({
  borderRadius: 0,
});
