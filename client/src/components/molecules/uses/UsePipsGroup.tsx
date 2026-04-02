import { customStyles } from '@/theme/morkBorgTheme';
import { Box } from '@mui/material';
import UsePipButton from '@components/atoms/UsePipButton';

interface UsePipsGroupProps {
  uses: boolean[];
  isUsePending: (useIndex: number) => boolean;
  createPipLabel: (useIndex: number, used: boolean) => string;
  onToggleUse: (useIndex: number) => void;
  pipTestId?: string;
}

export default function UsePipsGroup({
  uses,
  isUsePending,
  createPipLabel,
  onToggleUse,
  pipTestId,
}: UsePipsGroupProps) {
  return (
    <Box sx={customStyles.powersSection.usePipsContainer}>
      {uses.map((used, useIndex) => (
        <UsePipButton
          key={useIndex}
          used={used}
          isPending={isUsePending(useIndex)}
          ariaLabel={createPipLabel(useIndex, used)}
          onClick={() => onToggleUse(useIndex)}
          testId={pipTestId}
        />
      ))}
    </Box>
  );
}
