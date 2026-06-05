import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chip, Tooltip } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';

type HeaderValidationChipProps = {
  summary: string;
  label: string;
};

export function HeaderValidationChip({ summary, label }: HeaderValidationChipProps) {
  if (!summary) return null;

  return (
    <Tooltip title={summary} placement="bottom">
      <Chip
        data-testid="validation-issues-chip"
        size="small"
        icon={<WarningAmberIcon />}
        label={label}
        aria-label={`${label}: ${summary}`}
        variant="outlined"
        sx={customStyles.header.validationChip}
      />
    </Tooltip>
  );
}
