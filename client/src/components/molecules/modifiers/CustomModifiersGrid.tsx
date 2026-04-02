import { type CustomModifier } from '@/hooks/models';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import CustomModifierTag from '@components/molecules/CustomModifierTag';
import { getModifierTileMotion } from '@components/modifiers/motion';
import { getModifierTileSpan } from '@components/modifiers/utils';

interface CustomModifiersGridProps {
  modifiers: CustomModifier[];
  removingModifierIds: string[];
  reduceMotion: boolean;
  onEditModifier: (modifier: CustomModifier) => void;
  onRemoveModifier: (modifierId?: string) => void;
}

export default function CustomModifiersGrid({
  modifiers,
  removingModifierIds,
  reduceMotion,
  onEditModifier,
  onRemoveModifier,
}: CustomModifiersGridProps) {
  const { t } = useTranslation();
  const tileMotion = getModifierTileMotion(reduceMotion);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(6, minmax(0, 1fr))' },
        gridAutoRows: 'minmax(56px, auto)',
        gridAutoFlow: 'dense',
        gap: 1,
        mb: 2,
        minHeight: 40,
      }}
    >
      {modifiers.length === 0 ? (
        <Typography
          sx={{
            color: morkBorgColors.yellow,
            opacity: 0.4,
            fontStyle: 'italic',
            fontFamily: "'Alegreya', serif",
            fontSize: '0.8rem',
            gridColumn: '1 / -1',
          }}
        >
          {t('modifiers.noModifiers')}
        </Typography>
      ) : (
        <AnimatePresence initial={false} mode="popLayout">
          {modifiers.map((modifier, index) => {
            const key = modifier.id ?? `modifier-${index}`;
            const isRemoving = modifier.id
              ? removingModifierIds.includes(modifier.id)
              : false;
            const nameLength = (modifier.name ?? '').trim().length;
            const tileSpan = getModifierTileSpan(nameLength);

            if (isRemoving) return null;

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
                <CustomModifierTag
                  modifier={modifier}
                  onEdit={() => onEditModifier(modifier)}
                  onRemove={() => onRemoveModifier(modifier.id)}
                  isFull={tileSpan.full}
                  removeLabel={t('modifiers.removeModifier', 'Remove modifier')}
                  reduceMotion={reduceMotion}
                />
              </Box>
            );
          })}
        </AnimatePresence>
      )}
    </Box>
  );
}
