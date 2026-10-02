import { morkBorgColors } from "@/theme/morkBorgTheme";

export const abilityReferenceTableStyles = {
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 1,
    mt: 1,
  },
  button: {
    color: morkBorgColors.pink,
    borderColor: "rgba(255, 62, 181, 0.5)",
    fontFamily: "'Antonio', sans-serif",
    fontSize: "0.7rem",
    padding: "2px 8px",
    "&:hover": {
      borderColor: morkBorgColors.pink,
      bgcolor: "rgba(255, 62, 181, 0.1)",
    },
  },
  result: {
    color: morkBorgColors.yellow,
    fontFamily: "'Antonio', sans-serif",
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  rows: {
    listStyle: "none",
    m: 0,
    mt: 1,
    p: 0,
    display: "grid",
    gap: 0.75,
  },
  row: (rolled: boolean) => ({
    display: "flex",
    gap: 1,
    alignItems: "baseline",
    p: 0.5,
    borderLeft: `2px solid ${rolled ? morkBorgColors.yellow : "transparent"}`,
    bgcolor: rolled ? "rgba(255, 233, 0, 0.08)" : "transparent",
  }),
  roll: {
    color: morkBorgColors.pink,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "1.1rem",
    minWidth: "1.4rem",
    lineHeight: 1,
  },
  text: {
    color: morkBorgColors.white,
    fontFamily: "'Alegreya', serif",
    fontSize: "0.82rem",
    lineHeight: 1.4,
  },
  item: {
    color: morkBorgColors.yellow,
    opacity: 0.75,
    fontSize: "0.72rem",
    fontStyle: "italic",
  },
} as const;
