import { Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { morkBorgColors } from '@/theme/morkBorgTheme';

type SignedModifierValueSize = 'regular' | 'compact';

interface SignedModifierValueProps {
  value: number;
  size?: SignedModifierValueSize;
  pulse?: boolean;
}

const valuePulse = keyframes`
  0% { transform: scale(1); }
  60% { transform: scale(1.04); }
  100% { transform: scale(1); }
`;

const sizeStyles = {
  regular: {
    fontSize: '1rem',
  },
  compact: {
    fontSize: '0.9rem',
  },
} as const;

export default function SignedModifierValue({
  value,
  size = 'regular',
  pulse = false,
}: SignedModifierValueProps) {
  return (
    <Typography
      sx={{
        fontFamily: "'Bebas Neue', sans-serif",
        color: value < 0 ? morkBorgColors.pink : morkBorgColors.yellow,
        flexShrink: 0,
        animation: pulse
          ? `${valuePulse} 180ms cubic-bezier(0.22, 1, 0.36, 1)`
          : 'none',
        ...sizeStyles[size],
      }}
    >
      {value > 0 ? '+' : ''}
      {value}
    </Typography>
  );
}
