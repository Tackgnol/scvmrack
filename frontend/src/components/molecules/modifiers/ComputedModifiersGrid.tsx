import { type ComputedModifier } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import ComputedModifierTag from '@components/molecules/ComputedModifierTag';
import { getModifierTileMotion } from '@components/modifiers/motion';
import { getModifierTileSpan } from '@components/modifiers/utils';

interface ComputedModifiersGridProps {
  modifiers: ComputedModifier[];
  reduceMotion: boolean;
  onOpenModifier: (modifier: ComputedModifier) => void;
}

export default function ComputedModifiersGrid({
  modifiers,
  reduceMotion,
  onOpenModifier,
}: ComputedModifiersGridProps) {
  const { t } = useTranslation();

  if (modifiers.length === 0) return null;

  const tileMotion = getModifierTileMotion(reduceMotion);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          color: morkBorgColors.yellow,
          opacity: 0.5,
          fontSize: { xs: '0.78rem', sm: '0.7rem' },
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: "'Antonio', sans-serif",
        }}
      >
        {t('modifiers.fromEquipment')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(6, minmax(0, 1fr))',
          },
          gridAutoRows: 'minmax(52px, auto)',
          gridAutoFlow: 'dense',
          gap: 1,
        }}
      >
        <AnimatePresence initial={false}>
          {modifiers.map((modifier, index) => {
            const nameLength = (modifier.originName ?? '').trim().length;
            const tileSpan = getModifierTileSpan(nameLength);
            const key =
              modifier.originKey ??
              `${modifier.originName ?? 'computed'}-${modifier.statistic ?? 'agility'}-${modifier.value ?? 0}-${index}`;

            return (
              <Box
                key={key}
                component={motion.div}
                layout={!reduceMotion}
                initial={tileMotion.initial}
                animate={tileMotion.animate}
                exit={tileMotion.exit}
                transition={tileMotion.transition}
                sx={{
                  minWidth: 0,
                  gridColumn: { xs: 'span 1', sm: `span ${tileSpan.col}` },
                  gridRow: { xs: 'span 1', sm: `span ${tileSpan.row}` },
                }}
              >
                <ComputedModifierTag
                  modifier={modifier}
                  onOpen={onOpenModifier}
                  isFull={tileSpan.full}
                  reduceMotion={reduceMotion}
                />
              </Box>
            );
          })}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
