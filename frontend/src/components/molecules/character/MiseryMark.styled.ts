import { morkBorgColors } from "@/theme/morkBorgTheme";
import { styled } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { keyframes } from "@mui/system";

type MiseryMarkStyleProps = {
  compact: boolean;
  struck: boolean;
  next: boolean;
};

type MiseryMarkStyleContext = MiseryMarkStyleProps & {
  theme: Theme;
};

const shouldForwardMarkProp = (prop: PropertyKey) =>
  prop !== "compact" && prop !== "struck" && prop !== "next";

const miseryMarkStyles = ({
  theme,
  compact,
  struck,
  next,
}: MiseryMarkStyleContext) => ({
  position: "relative" as const,
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box" as const,
  minWidth: compact ? 0 : 44,
  minHeight: compact ? 0 : 44,
  padding: compact ? theme.spacing(0, 0.15) : 0,
  border: 0,
  borderBottom: next
    ? `3px solid ${morkBorgColors.pink}`
    : "3px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: struck ? "#888888" : morkBorgColors.yellow,
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: compact ? "0.78rem" : "1.5rem",
  lineHeight: 1,
  [theme.breakpoints.up("sm")]: compact
    ? {}
    : {
        minWidth: 30,
        minHeight: 34,
        padding: theme.spacing(0.25, 0.75),
        fontSize: "1.9rem",
      },
});

export const MiseryMarkButton = styled("button", {
  shouldForwardProp: shouldForwardMarkProp,
})<MiseryMarkStyleProps>((props) => ({
  ...miseryMarkStyles(props),
  cursor: "pointer",
  transition: "transform 100ms cubic-bezier(0.22, 1, 0.36, 1)",
  "&:hover": {
    transform: "translate(-2px, -2px)",
  },
  "&:active": {
    transform: "translate(0, 0)",
  },
  "&:focus-visible": {
    outline: `2px solid ${morkBorgColors.yellow}`,
    outlineOffset: 2,
  },
}));

export const MiseryMarkValue = styled("span", {
  shouldForwardProp: shouldForwardMarkProp,
})<MiseryMarkStyleProps>((props) => ({
  ...miseryMarkStyles(props),
  cursor: "inherit",
}));

const strikeIn = keyframes`
  from { transform: rotate(-4deg) scaleX(0); }
  to { transform: rotate(-4deg) scaleX(1); }
`;

type MiseryStrikeProps = {
  compact: boolean;
  final: boolean;
};

export const MiseryStrike = styled("span", {
  shouldForwardProp: (prop) => prop !== "compact" && prop !== "final",
})<MiseryStrikeProps>(({ theme, compact, final }) => ({
  position: "absolute",
  left: compact ? 0 : theme.spacing(0.5),
  right: compact ? 0 : theme.spacing(0.5),
  top: "50%",
  height: compact ? 2 : 3,
  backgroundColor: final ? morkBorgColors.blood : morkBorgColors.pink,
  transform: "rotate(-4deg)",
  transformOrigin: "left center",
  animation: `${strikeIn} 120ms cubic-bezier(0.22, 1, 0.36, 1)`,
  [theme.breakpoints.up("sm")]: compact
    ? {}
    : {
        left: 0,
        right: 0,
        height: 4,
      },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
}));
