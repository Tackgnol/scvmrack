import { morkBorgColors } from "@/theme/morkBorgTheme";
import { styled } from "@mui/material";

export const MiseryHeaderAnchor = styled("a")(({ theme }) => ({
  flexBasis: "100%",
  width: "fit-content",
  minHeight: 44,
  marginTop: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.8),
  border: `2px solid ${morkBorgColors.yellow}`,
  color: morkBorgColors.yellow,
  textDecoration: "none",
  transition:
    "border-color 100ms cubic-bezier(0.22, 1, 0.36, 1), transform 100ms cubic-bezier(0.22, 1, 0.36, 1)",
  "&:hover": {
    borderColor: morkBorgColors.pink,
    color: morkBorgColors.yellow,
    transform: "translate(-2px, -2px)",
  },
  "&:focus-visible": {
    outline: `2px solid ${morkBorgColors.yellow}`,
    outlineOffset: 2,
  },
  [theme.breakpoints.up("md")]: {
    flexBasis: "auto",
    width: "auto",
    minHeight: 30,
    marginTop: theme.spacing(0.35),
  },
}));

export const MiseryHeaderLabel = styled("span")({
  fontFamily: "'Antonio', sans-serif",
  fontSize: "0.6rem",
  lineHeight: 1,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
});
