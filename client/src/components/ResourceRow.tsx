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
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedNumber from './AnimatedNumber';
import MorkBorgModal from './MorkBorgModal';
import { keyframes } from '@mui/system';

const resourceFlash = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 233, 0, 0); }
  45% { box-shadow: 0 0 0 3px rgba(255, 233, 0, 0.45); }
  100% { box-shadow: 0 0 0 0 rgba(255, 233, 0, 0); }
`;

const numberPulse = keyframes`
  0% { transform: scale(1); }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export default function ResourcesRow() {
  const { character, updateField, updateArmorField } = useCharacter();
  const { t } = useTranslation();
  const [omensModalOpen, setOmensModalOpen] = useState(false);
  const [deathModalOpen, setDeathModalOpen] = useState(false);
  const [hpPulse, setHpPulse] = useState(false);
  const [omensPulse, setOmensPulse] = useState(false);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const previousHpRef = useRef<number | null>(null);
  const previousCharacterIdRef = useRef<string | null>(null);
  const previousOmensRef = useRef<number | null>(null);
  const hpPulseTimeoutRef = useRef<number | null>(null);
  const omensPulseTimeoutRef = useRef<number | null>(null);

  const currentHp = character?.current_hp ?? 0;
  const maxHp = character?.max_hp ?? 1;
  const omens = character?.omens ?? 0;
  const currentTier = character?.equipped_armor?.current_tier ?? 0;
  const maxTier = character?.equipped_armor?.max_tier ?? 0;
  const hasArmor = !!character?.equipped_armor;
  const characterKey = character?.id ?? 'unknown';

  useEffect(() => {
    if (!character?.id) return;

    const characterChanged = previousCharacterIdRef.current !== character.id;
    if (characterChanged) {
      previousCharacterIdRef.current = character.id;
      previousHpRef.current = null;
      previousOmensRef.current = null;
      if (hpPulseTimeoutRef.current) {
        window.clearTimeout(hpPulseTimeoutRef.current);
        hpPulseTimeoutRef.current = null;
      }
      if (omensPulseTimeoutRef.current) {
        window.clearTimeout(omensPulseTimeoutRef.current);
        omensPulseTimeoutRef.current = null;
      }
      setHpPulse(false);
      setOmensPulse(false);
    }

    const previousHp = previousHpRef.current;
    if (previousHp === null && currentHp === 0) {
      // Also trigger for characters loaded already at 0 HP.
      setDeathModalOpen(true);
    } else if (previousHp !== null && previousHp !== 0 && currentHp === 0) {
      setDeathModalOpen(true);
    }
    if (
      previousHp !== null &&
      previousHp !== currentHp &&
      !prefersReducedMotion
    ) {
      setHpPulse(true);
      if (hpPulseTimeoutRef.current) {
        window.clearTimeout(hpPulseTimeoutRef.current);
      }
      hpPulseTimeoutRef.current = window.setTimeout(
        () => setHpPulse(false),
        220
      );
    }
    previousHpRef.current = currentHp;
  }, [character?.id, currentHp, prefersReducedMotion]);

  useEffect(() => {
    if (previousOmensRef.current === null) {
      previousOmensRef.current = omens;
      return;
    }
    if (previousOmensRef.current !== omens && !prefersReducedMotion) {
      setOmensPulse(true);
      if (omensPulseTimeoutRef.current) {
        window.clearTimeout(omensPulseTimeoutRef.current);
      }
      omensPulseTimeoutRef.current = window.setTimeout(
        () => setOmensPulse(false),
        200
      );
    }
    previousOmensRef.current = omens;
  }, [omens, prefersReducedMotion]);

  const handleTierChange = (delta: number) => {
    const newTier = Math.max(0, Math.min(maxTier, currentTier + delta));
    if (newTier !== currentTier) {
      updateArmorField('current_tier', newTier);
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
        <Paper
          sx={{
            ...customStyles.resourceRow.paper,
            ...(hpPulse && !prefersReducedMotion
              ? { animation: `${resourceFlash} 240ms cubic-bezier(0.22, 1, 0.36, 1)` }
              : {}),
          }}
        >
          <Typography
            variant="subtitle2"
            color="secondary"
            sx={customStyles.resourceRow.label}
          >
            {t('stats.hitPoints')}
          </Typography>
          <Box sx={customStyles.hpContainer}>
            <TextField
              type="number"
              value={currentHp}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateField('current_hp', parseInt(e.target.value) || 0)
              }
              size="small"
              sx={customStyles.hpInput}
              inputProps={{ "data-testid": "hp-input" }}
            />
            <Typography sx={customStyles.hpDivider}>/</Typography>
            <Box sx={customStyles.maxHpBox}>
              <Typography sx={customStyles.maxHpText}>
                <AnimatedNumber
                  value={maxHp}
                  cacheKey={`${characterKey}:resources:max-hp`}
                  durationMs={320}
                />
              </Typography>
            </Box>
          </Box>
        </Paper>

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
            sx={{
              minWidth: 80,
              width: 80,
              height: 42,
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
            inputProps={{ "data-testid": "silver-input" }}
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
                gap: 0.5,
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleTierChange(-1)}
                disabled={currentTier <= 0}
                color="primary"
                sx={{ p: 0.25 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="h6"
                color="primary"
                sx={{
                  minWidth: '2ch',
                  textAlign: 'center',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '1.3rem',
                }}
              >
                <AnimatedNumber
                  value={currentTier}
                  cacheKey={`${characterKey}:resources:armor-tier`}
                  durationMs={280}
                />
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleTierChange(1)}
                disabled={currentTier >= maxTier}
                color="primary"
                sx={{ p: 0.25 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <TextField
              type="text"
              value="−"
              size="small"
              slotProps={{ input: { readOnly: true } }}
              sx={customStyles.resourceInput}
            />
          )}
        </Paper>
      </Box>

      <MorkBorgModal
        open={omensModalOpen}
        onClose={() => setOmensModalOpen(false)}
        title={
          <>
            {t('omensModal.title', 'Omens')} (
            <AnimatedNumber
              value={omens}
              cacheKey={`${characterKey}:resources:omens-modal`}
              durationMs={260}
            />
            )
          </>
        }
        maxWidth="sm"
        actions={
          <>
            <Button onClick={handleAddOmen} variant="outlined">
              {t('omensModal.add', 'Add Omen')}
            </Button>
            <Button
              onClick={handleUseOmen}
              variant="contained"
              disabled={omens <= 0}
            >
              {t('omensModal.use', 'Use Omen')}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'grid', gap: 0.75, mb: 2.25 }}>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t(
              'omensModal.rules.maxDamage',
              '† Deal maximum damage with an attack'
            )}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t(
              'omensModal.rules.reroll',
              "† Reroll a dice roll (yours or someone else's)"
            )}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t(
              'omensModal.rules.lowerDamage',
              '† Lower damage dealt to you by d6'
            )}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t('omensModal.rules.neutralize', '† Neutralize a Crit or Fumble')}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t('omensModal.rules.lowerDr', "† Lower one test's DR by -4")}
          </Typography>
        </Box>
      </MorkBorgModal>

      <MorkBorgModal
        open={deathModalOpen}
        onClose={() => setDeathModalOpen(false)}
        title={t('deathModal.title', "It's not ever...yet")}
        maxWidth="sm"
        actions={
          <Button onClick={() => setDeathModalOpen(false)} variant="contained">
            {t('deathModal.close', 'Close')}
          </Button>
        }
      >
        <Typography
          sx={{ color: morkBorgColors.pink, mb: 1.25, textAlign: 'left' }}
        >
          {t('deathModal.rollPrompt', 'Roll a d4')}
        </Typography>

        <Box sx={{ display: 'grid', gap: 0.85, mb: 2.25 }}>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t(
              'deathModal.rules.one',
              '1 Fall unconscious for d4 rounds; then awaken with d4 HP.'
            )}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t(
              'deathModal.rules.two',
              "2 Roll a d6: 1-5 = Broken or severed limb. 6 = Lost eye. Can't act for d4 rounds; then become active with d4 HP."
            )}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t(
              'deathModal.rules.three',
              '3 Haemorrhage: death in two hours unless treated. All tests are DR16 the first hour; then DR18 the last hour.'
            )}
          </Typography>
          <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
            {t('deathModal.rules.four', '4 Dead. Lose one HP.')}
          </Typography>
        </Box>
      </MorkBorgModal>
    </>
  );
}
