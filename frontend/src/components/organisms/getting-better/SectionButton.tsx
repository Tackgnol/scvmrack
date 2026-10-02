import { Button } from "@mui/material";
import { gettingBetterStyles as styles } from "./GettingBetterPanel.styles";

type Props = {
  label: string;
  onClick: () => void;
  disabled: boolean;
};

export function SectionButton({ label, onClick, disabled }: Props) {
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
