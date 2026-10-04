import { partyColors, partyFonts } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { keyframes } from "@mui/system";

const { blood, white, black } = partyColors;

const reveal = keyframes`
  from { clip-path: inset(0 0 100% 0); }
  to { clip-path: inset(0 0 0 0); }
`;

export const Confirm = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background: blood,
  color: white,
  padding: 12,
  border: `2px solid ${black}`,
  fontFamily: partyFonts.body,
  animation: `${reveal} 200ms cubic-bezier(0.16,1,0.3,1)`,
  "& p": { margin: 0, maxWidth: "65ch" },
  "& button": { borderColor: white, color: white },
  "& button.danger": { background: white, color: blood },
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

export const Actions = styled("div")({ display: "flex", flexWrap: "wrap", gap: 8 });
