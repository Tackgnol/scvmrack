import LockIcon from '@mui/icons-material/Lock';
import { Box, Typography } from '@mui/material';
import { type ComputedModifier } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import ModifierStatChip from '@components/atoms/ModifierStatChip';
import SignedModifierValue from '@components/atoms/SignedModifierValue';
import { useValuePulse } from '@/hooks/useValuePulse';
import { useTranslation } from 'react-i18next';

interface ComputedModifierTagProps {
  modifier: ComputedModifier;
  onOpen: (modifier: ComputedModifier) => void;
  isFull: boolean;
  reduceMotion?: boolean;
}

export default function ComputedModifierTag({
  modifier,
  onOpen,
  isFull,
  reduceMotion,
}: ComputedModifierTagProps) {
  const { t } = useTranslation();
  const value = modifier.value ?? 0;
  const pulse = useValuePulse(value, reduceMotion);
  const originName =
    modifier.originName ?? t('modifiers.computed.unknownOrigin');
  const statistic = modifier.statistic ?? 'agility';
  const statisticLabel = t(
    `attributes.${statistic}Short`,
    statistic,
  ).toUpperCase();

  return (
    <Box
      onClick={() => onOpen(modifier)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(modifier);
        }
      }}
      role="button"
      tabIndex={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: isFull ? 'wrap' : 'nowrap',
        columnGap: 0.7,
        rowGap: 0.55,
        bgcolor: morkBorgColors.darkGrey,
        border: `1px solid ${morkBorgColors.darkGrey}`,
        p: 0.95,
        minHeight: 52,
        height: '100%',
        opacity: 0.8,
        cursor: 'pointer',
        '&:hover': {
          opacity: 1,
          border: `1px solid ${morkBorgColors.yellow}`,
        },
        '&:focus-visible': {
          outline: `2px solid ${morkBorgColors.yellow}`,
          outlineOffset: '2px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.7,
          minWidth: 0,
          flexGrow: 1,
          flexBasis: isFull ? '100%' : 'auto',
        }}
      >
        <LockIcon sx={{ fontSize: 14, color: '#666' }} />
        <Typography
          variant="body2"
          sx={{
            color: '#999',
            minWidth: 0,
            overflow: isFull ? 'visible' : 'hidden',
            textOverflow: isFull ? 'clip' : 'ellipsis',
            whiteSpace: isFull ? 'normal' : 'nowrap',
            lineHeight: isFull ? 1.3 : 1.2,
            wordBreak: isFull ? 'break-word' : 'normal',
          }}
        >
          {originName}
        </Typography>
      </Box>
      <ModifierStatChip
        label={statisticLabel}
        density="compact"
      />
      <SignedModifierValue value={value} size="compact" pulse={pulse} />
    </Box>
  );
}
