import { customStyles } from '@/theme/morkBorgTheme';
import { Box, Typography } from '@mui/material';
import UsePipsGroup from '@components/molecules/uses/UsePipsGroup';

interface TrackedUseRowProps {
  number: number;
  name: string;
  description?: string;
  supplementalText?: string;
  uses: boolean[];
  isUsePending: (useIndex: number) => boolean;
  createPipLabel: (useIndex: number, used: boolean) => string;
  onToggleUse: (useIndex: number) => void;
  pipTestId?: string;
}

export default function TrackedUseRow({
  number,
  name,
  description,
  supplementalText,
  uses,
  isUsePending,
  createPipLabel,
  onToggleUse,
  pipTestId,
}: TrackedUseRowProps) {
  return (
    <Box sx={customStyles.powersSection.powerRow}>
      <Typography sx={customStyles.powersSection.powerNumber}>{number}</Typography>

      <Box sx={customStyles.powersSection.powerText}>
        <Typography sx={customStyles.powersSection.powerName}>{name}</Typography>
        {description && (
          <Typography sx={customStyles.powersSection.powerDescription}>
            {description}
          </Typography>
        )}
        {supplementalText && (
          <Typography sx={customStyles.powersSection.powerDescription}>
            {supplementalText}
          </Typography>
        )}
      </Box>

      <UsePipsGroup
        uses={uses}
        isUsePending={isUsePending}
        createPipLabel={createPipLabel}
        onToggleUse={onToggleUse}
        pipTestId={pipTestId}
      />
    </Box>
  );
}
