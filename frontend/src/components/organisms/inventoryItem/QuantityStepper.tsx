import { Box, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { AnimatedNumber } from '@components/index';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** Optional label rendered above the stepper. Pass empty string to hide. */
  label?: string;
  /** Lower bound, inclusive. Defaults to 1 (no zero-quantity inventory). */
  min?: number;
  /** Upper bound, inclusive. Defaults to no upper bound. */
  max?: number;
  /** Stable cache key for the animated readout, so multiple instances don't fight. */
  cacheKey: string;
}

const stepperBtnStyle = {
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: `1px solid ${morkBorgColors.darkGrey}`,
  color: morkBorgColors.white,
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.2rem',
  lineHeight: 1,
  cursor: 'pointer',
  transition:
    'background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease',
  '&:hover': {
    backgroundColor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    borderColor: morkBorgColors.yellow,
  },
  '&.Mui-disabled': {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
} as const;

const readoutStyle = {
  minWidth: 56,
  textAlign: 'center' as const,
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.4rem',
  letterSpacing: '0.05em',
  color: morkBorgColors.white,
};

const labelStyle = {
  color: morkBorgColors.yellow,
  fontFamily: "'Antonio', sans-serif",
  fontSize: '0.7rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  mb: 0.5,
};

// Brutalist square stepper. Borrows the visual vocabulary of the kind tiles
// (1px darkGrey border, hover flip to yellow-on-black) so the inventory and
// custom-item modals feel like the same toolkit.
export default function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max,
  cacheKey,
}: QuantityStepperProps) {
  const { t } = useTranslation();
  const atMin = value <= min;
  const atMax = typeof max === 'number' && value >= max;

  return (
    <Box>
      {label !== '' && (
        <Typography sx={labelStyle}>
          {label ?? t('equipment.quantity', 'Quantity')}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ButtonBase
          sx={stepperBtnStyle}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={atMin}
          aria-label={t('equipment.decreaseQuantity', 'Decrease quantity')}
        >
          −
        </ButtonBase>
        <Typography sx={readoutStyle}>
          <AnimatedNumber value={value} cacheKey={cacheKey} durationMs={220} />
        </Typography>
        <ButtonBase
          sx={stepperBtnStyle}
          onClick={() =>
            onChange(typeof max === 'number' ? Math.min(max, value + 1) : value + 1)
          }
          disabled={atMax}
          aria-label={t('equipment.increaseQuantity', 'Increase quantity')}
        >
          +
        </ButtonBase>
      </Box>
    </Box>
  );
}
