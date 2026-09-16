import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, IconButton, TextField } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { useIntegerFieldBuffer } from '@/hooks/useIntegerFieldBuffer';

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
  const input = useIntegerFieldBuffer(value, onInputChange);

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
        type="text"
        inputMode="numeric"
        value={input.value}
        onChange={input.onChange}
        onBlur={input.onBlur}
        onKeyDown={input.onKeyDown}
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
