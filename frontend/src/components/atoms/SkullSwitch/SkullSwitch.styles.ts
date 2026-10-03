import { partyColors } from "@/theme/partyTokens";
import { styled } from "@mui/material";
import { keyframes } from "@mui/system";

const { yellow, black, white, grey, darkGrey, mutedText } = partyColors;

const thumbOn = keyframes`
  0% { transform: translateX(0) rotate(0); }
  45% { transform: translateX(24px) rotate(14deg); }
  70% { transform: translateX(37px) rotate(-5deg) scale(1.08, 0.9); }
  86% { transform: translateX(33px) rotate(2deg) scale(0.97, 1.04); }
  100% { transform: translateX(34px) rotate(0) scale(1); }
`;
const thumbOff = keyframes`
  0% { transform: translateX(34px) rotate(0); }
  45% { transform: translateX(10px) rotate(-14deg); }
  70% { transform: translateX(-3px) rotate(5deg) scale(1.08, 0.9); }
  86% { transform: translateX(1px) rotate(-2deg) scale(0.97, 1.04); }
  100% { transform: translateX(0) rotate(0) scale(1); }
`;
const trackOn = keyframes`
  0%, 20% { fill: ${grey}; stroke: ${mutedText}; }
  70%, 100% { fill: ${yellow}; stroke: ${black}; }
`;
const trackOff = keyframes`
  0%, 20% { fill: ${yellow}; stroke: ${black}; }
  70%, 100% { fill: ${grey}; stroke: ${mutedText}; }
`;
const edgeOn = keyframes`
  0%, 30% { fill: ${mutedText}; }
  80%, 100% { fill: ${white}; }
`;
const edgeOff = keyframes`
  0%, 30% { fill: ${white}; }
  80%, 100% { fill: ${mutedText}; }
`;
const markOut = keyframes`
  0% { opacity: 1; }
  30%, 100% { opacity: 0; }
`;
const markIn = keyframes`
  0%, 65% { opacity: 0; transform: scale(0.4); }
  85% { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
`;

const FLIP = "0.42s";
const BOUNCE = "cubic-bezier(.3,.7,.3,1)";

export const SwitchButton = styled("button")({
  display: "inline-flex",
  alignItems: "center",
  flex: "none",
  background: "none",
  border: 0,
  padding: "6px 0",
  minHeight: 44,
  cursor: "pointer",
  color: white,
  "& > svg": { width: 72, height: 34, flex: "none", overflow: "visible" },
  "& .track": {
    fill: grey,
    stroke: mutedText,
    strokeWidth: 2,
    transition: "fill .14s, stroke .14s",
  },
  "& .mark": {
    fill: "none",
    strokeWidth: 3,
    strokeLinecap: "square",
    transition: "opacity .14s",
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  "& .mark-no": { stroke: mutedText },
  "& .mark-yes": { stroke: black, opacity: 0 },
  "& .thumb": {
    transform: "translateX(0)",
    transition: "transform .16s cubic-bezier(.2,.8,.2,1)",
    transformBox: "view-box",
    transformOrigin: "15px 15px",
  },
  "& .edge": { fill: mutedText, stroke: black, strokeWidth: 1.5 },
  '&[aria-checked="true"] .track': { fill: yellow, stroke: black },
  '&[aria-checked="true"] .mark-no': { opacity: 0 },
  '&[aria-checked="true"] .mark-yes': { opacity: 1 },
  '&[aria-checked="true"] .thumb': { transform: "translateX(34px)" },
  '&[aria-checked="true"] .edge': { fill: white },
  "&:hover .track": { stroke: yellow },
  '&[aria-checked="true"]:hover .track': { stroke: white },
  "&:focus-visible": { outline: `2px solid ${yellow}`, outlineOffset: 3 },
  '&[aria-disabled="true"]': { cursor: "not-allowed" },
  '&[aria-disabled="true"] .track, &[aria-disabled="true"]:hover .track': {
    fill: "transparent",
    stroke: darkGrey,
    strokeDasharray: "3 2",
  },
  '&[aria-disabled="true"] .mark': { opacity: 0 },
  '&[aria-disabled="true"] .edge': { fill: darkGrey },
  "&.flip-on .thumb": { animation: `${thumbOn} ${FLIP} ${BOUNCE}` },
  "&.flip-off .thumb": { animation: `${thumbOff} ${FLIP} ${BOUNCE}` },
  "&.flip-on .track": { animation: `${trackOn} ${FLIP} linear` },
  "&.flip-off .track": { animation: `${trackOff} ${FLIP} linear` },
  "&.flip-on .edge": { animation: `${edgeOn} ${FLIP} linear` },
  "&.flip-off .edge": { animation: `${edgeOff} ${FLIP} linear` },
  "&.flip-on .mark-no, &.flip-off .mark-yes": {
    animation: `${markOut} ${FLIP} linear`,
  },
  "&.flip-on .mark-yes, &.flip-off .mark-no": {
    animation: `${markIn} ${FLIP} ${BOUNCE}`,
  },
  "@media (prefers-reduced-motion: reduce)": {
    "&, & *": { transition: "none !important", animation: "none !important" },
  },
});
