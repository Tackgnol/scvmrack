import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { customStyles, morkBorgColors } from '@theme/morkBorgTheme.ts';
import { useValuePulse } from '@/hooks/useValuePulse';
import { type ChangeEvent, useState } from 'react';
import { useHpDeathWatch } from '@/hooks/useHpDeathWatch';
import { useTranslation } from 'react-i18next';
import AnimatedNumber from '../atoms/AnimatedNumber';
import HpControl from './resources/HpControl';
import OmensModal from './resources/OmensModal';
import DeathModal from './resources/DeathModal';
import { keyframes } from '@mui/system';

const numberPulse = keyframes`
  0% { transform: scale(1); }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function ResourcesRow() {
  const { character, updateField, updateArmorField, killAndReplace } = useCharacter();
  const { t } = useTranslation();
  const [omensModalOpen, setOmensModalOpen] = useState(false);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const currentHp = character?.currentHp ?? 0;
  const maxHp = character?.maxHp ?? 1;
  const omens = character?.omens ?? 0;
  const omensPulse = useValuePulse(omens, prefersReducedMotion);
  const currentTier = character?.equippedArmor?.currentTier ?? 0;
  const maxTier = character?.equippedArmor?.maxTier ?? 0;
  const hasArmor = !!character?.equippedArmor;
  const characterKey = character?.id ?? 'unknown';
  const { hpPulse, deathModalOpen, setDeathModalOpen } = useHpDeathWatch(
    currentHp,
    character?.id ?? null,
    prefersReducedMotion,
  );

  const handleTierChange = (delta: number) => {
    const newTier = Math.max(0, Math.min(maxTier, currentTier + delta));
    if (newTier !== currentTier) {
      updateArmorField('currentTier', newTier);
    }
  };

  const handleHpStep = (delta: number) => {
    const nextHp = Math.max(0, currentHp + delta);
    if (nextHp !== currentHp) {
      updateField('currentHp', nextHp);
    }
  };

  const handleUseOmen = () => {
    updateField('omens', Math.max(0, omens - 1));
    setOmensModalOpen(false);
  };

  const handleAddOmen = () => {
    updateField('omens', omens + 1);
    setOmensModalOpen(false);
  };

  return (
    <>
      <Box sx={customStyles.resourceRow.container}>
        {/* HP — special layout with current / max */}
        <HpControl
          currentHp={currentHp}
          maxHp={maxHp}
          cacheKey={characterKey}
          pulsing={hpPulse && !prefersReducedMotion}
          onSetHp={(value) => updateField('currentHp', value)}
          onStepHp={handleHpStep}
        />

        {/* Omens — modal trigger */}
        <Paper sx={customStyles.resourceRow.paper}>
          <Typography
            variant="subtitle2"
            color="secondary"
            sx={customStyles.resourceRow.label}
          >
            {t('stats.omens')}
          </Typography>
          <Button
            type="button"
            onClick={() => setOmensModalOpen(true)}
            aria-label={`${t('omensModal.title', 'Omens')}: ${omens}`}
            sx={{
              minWidth: { xs: 88, sm: 80 },
              width: { xs: 88, sm: 80 },
              height: { xs: 44, sm: 42 },
              bgcolor: morkBorgColors.yellow,
              color: morkBorgColors.black,
              border: `2px solid ${morkBorgColors.black}`,
              borderRadius: 0,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.4rem',
              lineHeight: 1,
              '&:hover': {
                bgcolor: morkBorgColors.pink,
              },
              ...(omensPulse && !prefersReducedMotion
                ? {
                    animation: `${numberPulse} 180ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  }
                : {}),
            }}
          >
            <AnimatedNumber
              value={omens}
              cacheKey={`${characterKey}:resources:omens`}
              durationMs={300}
            />
          </Button>
        </Paper>

        {/* Silver */}
        <Paper sx={customStyles.resourceRow.paper}>
          <Typography
            variant="subtitle2"
            color="secondary"
            sx={customStyles.resourceRow.label}
          >
            {t('stats.silver')}
          </Typography>
          <TextField
            type="number"
            value={character?.silver ?? 0}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateField('silver', parseInt(e.target.value) || 0)
            }
            size="small"
            sx={customStyles.resourceInput}
            slotProps={{
              htmlInput: {
                "data-testid": "silver-input",
                "aria-label": t('stats.silver'),
              }
            }}
          />
        </Paper>

        {/* Armor Tier — +/- buttons or dash */}
        <Paper sx={customStyles.resourceRow.paper}>
          <Typography
            variant="subtitle2"
            color="secondary"
            sx={customStyles.resourceRow.label}
          >
            {t('stats.armorTier')}
          </Typography>
          {hasArmor ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 1, sm: 0.5 },
              }}
            >
              <IconButton
                onClick={() => handleTierChange(-1)}
                disabled={currentTier <= 0}
                color="primary"
                sx={{
                  width: { xs: 36, sm: 30 },
                  height: { xs: 40, sm: 30 },
                  border: `2px solid ${morkBorgColors.yellow}`,
                  borderRadius: 0,
                  p: 0,
                }}
                aria-label={t('common.decreaseArmorTier', 'Decrease armor tier')}
              >
                <RemoveIcon sx={{ fontSize: { xs: 22, sm: 18 } }} />
              </IconButton>
              <Typography
                variant="h6"
                color="primary"
                sx={{
                  minWidth: '2ch',
                  textAlign: 'center',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: { xs: '1.45rem', sm: '1.3rem' },
                }}
              >
                <AnimatedNumber
                  value={currentTier}
                  cacheKey={`${characterKey}:resources:armor-tier`}
                  durationMs={280}
                />
              </Typography>
              <IconButton
                onClick={() => handleTierChange(1)}
                disabled={currentTier >= maxTier}
                color="primary"
                sx={{
                  width: { xs: 36, sm: 30 },
                  height: { xs: 40, sm: 30 },
                  border: `2px solid ${morkBorgColors.yellow}`,
                  borderRadius: 0,
                  p: 0,
                }}
                aria-label={t('common.increaseArmorTier', 'Increase armor tier')}
              >
                <AddIcon sx={{ fontSize: { xs: 22, sm: 18 } }} />
              </IconButton>
            </Box>
          ) : (
            <TextField
              type="text"
              value="−"
              size="small"
              slotProps={{
                input: {
                  readOnly: true,
                  'aria-label': t('stats.armorTier'),
                },
              }}
              sx={customStyles.resourceInput}
            />
          )}
        </Paper>
      </Box>

      <OmensModal
        open={omensModalOpen}
        onClose={() => setOmensModalOpen(false)}
        omens={omens}
        cacheKey={`${characterKey}:resources:omens-modal`}
        onAddOmen={handleAddOmen}
        onUseOmen={handleUseOmen}
      />

      <DeathModal
        open={deathModalOpen}
        onClose={() => setDeathModalOpen(false)}
        onKill={() => {
          setDeathModalOpen(false);
          killAndReplace();
        }}
      />
    </>
  );
}
