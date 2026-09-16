import { Box, IconButton, Paper, TextField, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { customStyles, morkBorgColors } from '@theme/morkBorgTheme.ts';
import { useTranslation } from 'react-i18next';
import AnimatedNumber from '../../atoms/AnimatedNumber';
import { useIntegerFieldBuffer } from '../../../hooks/useIntegerFieldBuffer';

const resourceFlash = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 233, 0, 0); }
  45% { box-shadow: 0 0 0 3px rgba(255, 233, 0, 0.45); }
  100% { box-shadow: 0 0 0 0 rgba(255, 233, 0, 0); }
`;

const hpAdjustButtonSx = {
  decrease: {
    height: { xs: 40, sm: 24 },
    width: { xs: 32, sm: 34 },
    minWidth: { xs: 32, sm: 34 },
    border: `2px solid ${morkBorgColors.black}`,
    borderRadius: 0,
    p: 0,
    bgcolor: '#8b0000',
    color: morkBorgColors.yellow,
    boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
    transition: 'all 0.12s ease-out',
    '&:hover': {
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      transform: 'translate(-1px, -1px)',
      boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    },
    '&:active': {
      transform: 'translate(0, 0)',
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      color: 'rgba(255, 233, 0, 0.35)',
      borderColor: '#3b1a1a',
      bgcolor: '#2a1212',
      boxShadow: 'none',
    },
  },
  increase: {
    height: { xs: 40, sm: 24 },
    width: { xs: 32, sm: 34 },
    minWidth: { xs: 32, sm: 34 },
    border: `2px solid ${morkBorgColors.black}`,
    borderRadius: 0,
    p: 0,
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
    transition: 'all 0.12s ease-out',
    '&:hover': {
      bgcolor: '#fff2a3',
      color: morkBorgColors.black,
      transform: 'translate(-1px, -1px)',
      boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    },
    '&:active': {
      transform: 'translate(0, 0)',
      boxShadow: 'none',
    },
  },
};

type HpControlProps = {
  currentHp: number;
  maxHp: number;
  cacheKey: string;
  pulsing: boolean;
  onSetHp: (value: number) => void;
  onStepHp: (delta: number) => void;
};

export default function HpControl({
  currentHp,
  maxHp,
  cacheKey,
  pulsing,
  onSetHp,
  onStepHp,
}: HpControlProps) {
  const { t } = useTranslation();
  const hpInput = useIntegerFieldBuffer(currentHp, (digits) =>
    onSetHp(parseInt(digits, 10))
  );

  return (
    <Paper
      sx={{
        ...customStyles.resourceRow.paper,
        ...(pulsing
          ? { animation: `${resourceFlash} 240ms cubic-bezier(0.22, 1, 0.36, 1)` }
          : {}),
      }}
    >
      <Typography variant="subtitle2" color="secondary" sx={customStyles.resourceRow.label}>
        {t('stats.hitPoints')}
      </Typography>
      <Box
        sx={{
          ...customStyles.hpContainer,
          width: { xs: 118, sm: 110 },
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '56px auto 44px',
            alignItems: 'center',
            columnGap: { xs: 0.45, sm: 0.35 },
            px: { xs: 0.45, sm: 0.35 },
            py: { xs: 0.32, sm: 0.22 },
            border: `2px solid ${morkBorgColors.black}`,
            bgcolor: 'rgba(255, 233, 0, 0.18)',
            boxShadow: `2px 2px 0 rgba(10, 10, 10, 0.38)`,
          }}
        >
          <TextField
            type="text"
            inputMode="numeric"
            value={hpInput.value}
            onChange={hpInput.onChange}
            onBlur={hpInput.onBlur}
            onKeyDown={hpInput.onKeyDown}
            size="small"
            sx={{
              ...customStyles.hpInput,
              width: { xs: 56, sm: 50 },
            }}
            slotProps={{
              htmlInput: {
                'data-testid': 'hp-input',
                'aria-label': t('stats.hitPoints'),
              },
            }}
          />
          <Typography
            sx={{
              ...customStyles.hpDivider,
              fontSize: { xs: '1.3rem', sm: '1.1rem' },
              color: morkBorgColors.black,
              justifySelf: 'center',
            }}
          >
            /
          </Typography>
          <Box
            sx={{
              ...customStyles.maxHpBox,
              width: { xs: 44, sm: 40 },
              height: { xs: 34, sm: 32 },
              borderColor: morkBorgColors.black,
              bgcolor: morkBorgColors.black,
            }}
          >
            <Typography
              sx={{
                ...customStyles.maxHpText,
                fontSize: { xs: '1.15rem', sm: '1.05rem' },
                color: morkBorgColors.yellow,
              }}
            >
              <AnimatedNumber
                value={maxHp}
                cacheKey={`${cacheKey}:resources:max-hp`}
                durationMs={320}
              />
            </Typography>
          </Box>
        </Box>

        <IconButton
          type="button"
          onClick={() => onStepHp(-1)}
          disabled={currentHp <= 0}
          color="primary"
          data-testid="hp-decrease"
          aria-label={t('common.decreaseHitPoints')}
          sx={{
            ...hpAdjustButtonSx.decrease,
            position: 'absolute',
            left: { xs: -16, sm: -16 },
            top: { xs: '50%', sm: '12%' },
            transform: 'translateY(-50%) rotate(-3deg)',
            zIndex: 1,
            '&:hover': {
              bgcolor: morkBorgColors.pink,
              color: morkBorgColors.black,
              transform: 'translate(-1px, calc(-50% - 1px)) rotate(-3deg)',
              boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
            },
            '&:active': {
              transform: 'translateY(-50%) rotate(-3deg)',
              boxShadow: 'none',
            },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: { xs: '1.25rem', sm: '1.15rem' },
              lineHeight: 1,
              mt: '-1px',
            }}
          >
            -
          </Typography>
        </IconButton>

        <IconButton
          type="button"
          onClick={() => onStepHp(1)}
          color="primary"
          data-testid="hp-increase"
          aria-label={t('common.increaseHitPoints')}
          sx={{
            ...hpAdjustButtonSx.increase,
            position: 'absolute',
            right: { xs: -16, sm: -16 },
            top: { xs: '50%', sm: '72%' },
            transform: 'translateY(-50%) rotate(3deg)',
            zIndex: 1,
            '&:hover': {
              bgcolor: '#fff2a3',
              color: morkBorgColors.black,
              transform: 'translate(-1px, calc(-50% - 1px)) rotate(3deg)',
              boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
            },
            '&:active': {
              transform: 'translateY(-50%) rotate(3deg)',
              boxShadow: 'none',
            },
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: { xs: '1.25rem', sm: '1.15rem' },
              lineHeight: 1,
              mt: '-1px',
            }}
          >
            +
          </Typography>
        </IconButton>
      </Box>
    </Paper>
  );
}
