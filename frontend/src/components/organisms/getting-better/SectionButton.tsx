import { Button } from "@mui/material";
import { gettingBetterStyles as styles } from "./GettingBetterPanel.styles";
import type { SectionButtonProps } from "./SectionButton.models";

export function SectionButton({ label, onClick, disabled }: SectionButtonProps) {
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={styles.actionButton}
    >
      {label}
    </Button>
  );
}

export default SectionButton;
