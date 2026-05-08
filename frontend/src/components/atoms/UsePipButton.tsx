import { customStyles } from '@/theme/morkBorgTheme';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';

const PIP_SAVE_PULSE = keyframes`
  0% {
    transform: scale(0.9);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
`;

interface UsePipButtonProps {
  used: boolean;
  isPending: boolean;
  ariaLabel: string;
  onClick: () => void;
  testId?: string;
}

export default function UsePipButton({
  used,
  isPending,
  ariaLabel,
  onClick,
  testId,
}: UsePipButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={used}
      aria-busy={isPending}
      data-testid={testId}
      sx={{
        ...customStyles.powersSection.usePip.base,
        ...(used
          ? customStyles.powersSection.usePip.used
          : customStyles.powersSection.usePip.unused),
        ...(isPending && {
          '&::after': {
            content: '""',
            position: 'absolute',
            width: { xs: 20, sm: 18 },
            height: { xs: 20, sm: 18 },
            borderRadius: '50%',
            border: '2px solid rgba(10, 10, 10, 0.65)',
            animation: `${PIP_SAVE_PULSE} 650ms ease-out infinite`,
            pointerEvents: 'none',
          },
        }),
      }}
    />
  );
}
