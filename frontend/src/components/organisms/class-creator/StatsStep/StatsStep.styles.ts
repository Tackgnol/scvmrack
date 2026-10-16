import { styled } from "@mui/material";

export const DiceGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "18px 20px",
  alignItems: "start",
});
