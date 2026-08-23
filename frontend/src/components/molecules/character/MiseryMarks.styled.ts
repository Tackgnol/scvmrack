import { styled } from "@mui/material";

type MiseryMarksRowProps = {
  compact: boolean;
};

export const MiseryMarksRow = styled("div", {
  shouldForwardProp: (prop) => prop !== "compact",
})<MiseryMarksRowProps>(({ theme, compact }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: compact ? "flex-start" : "space-between",
  gap: compact ? theme.spacing(0.35) : 0,
  width: compact ? "auto" : "100%",
  [theme.breakpoints.up("sm")]: {
    justifyContent: "flex-start",
    gap: compact ? theme.spacing(0.35) : theme.spacing(1.25),
    width: "auto",
  },
}));
