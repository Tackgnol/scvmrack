import { morkBorgColors } from "@/theme/morkBorgTheme";
import { styled, Typography } from "@mui/material";

export const MiseryControlTitle = styled(Typography)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  display: "inline-block",
  marginBottom: -2,
  padding: theme.spacing(0.25, 1.25),
  color: morkBorgColors.black,
  backgroundColor: morkBorgColors.yellow,
  border: `3px solid ${morkBorgColors.black}`,
  boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
  transform: "rotate(-0.4deg)",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  textWrap: "balance",
}));

export const MiseryControlPanel = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "space-between",
  gap: theme.spacing(1.25),
  padding: theme.spacing(1.5),
  color: morkBorgColors.white,
  backgroundColor: morkBorgColors.black,
  border: `1px solid ${morkBorgColors.grey}`,
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(3),
    padding: theme.spacing(2.5),
  },
}));

export const MiseryControlSummary = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row-reverse",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: theme.spacing(0.5),
  paddingTop: theme.spacing(1),
  borderTop: `1px solid ${morkBorgColors.grey}`,
  [theme.breakpoints.up("sm")]: {
    minWidth: 150,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingTop: 0,
    borderTop: 0,
  },
}));

export const MiseryControlCount = styled("p")(({ theme }) => ({
  margin: 0,
  color: morkBorgColors.yellow,
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: "1.3rem",
  lineHeight: 1,
  letterSpacing: "0.05em",
  [theme.breakpoints.up("sm")]: {
    fontSize: "1.5rem",
  },
}));

export const MiseryControlStatus = styled("p")(({ theme }) => ({
  maxWidth: "28ch",
  margin: 0,
  color: "#888888",
  fontFamily: "'Antonio', sans-serif",
  fontSize: "0.65rem",
  lineHeight: 1.2,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  textAlign: "left",
  textWrap: "pretty",
  [theme.breakpoints.up("sm")]: {
    textAlign: "right",
  },
}));

export const MiseryControlActionSlot = styled("div")({
  flex: "0 0 auto",
});
