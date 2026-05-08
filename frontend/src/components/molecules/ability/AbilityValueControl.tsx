import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, IconButton, TextField } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';

interface AbilityValueControlProps {
  value: number;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onInputChange: (rawValue: string) => void;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
}

export default function AbilityValueControl({
  value,
  label,
  onDecrease,
  onIncrease,
  onInputChange,
  decreaseAriaLabel,
  increaseAriaLabel,
}: AbilityValueControlProps) {
  return (
    <Box sx={customStyles.abilityCardTwo.controls}>
      <IconButton
        onClick={onDecrease}
        sx={customStyles.abilityAdjustButton}
        aria-label={decreaseAriaLabel}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>

      <TextField
        type="number"
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
        sx={customStyles.abilityValueInput}
        size="small"
        inputProps={{ 'aria-label': label }}
      />

      <IconButton
        onClick={onIncrease}
        sx={customStyles.abilityAdjustButton}
        aria-label={increaseAriaLabel}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
