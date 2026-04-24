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
import AnimatedNumber from '../atoms/AnimatedNumber';
import MorkBorgModal from './modal/MorkBorgModal';
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
  const { character, updateField, updateArmorField, killAndReplace } = useCharacter();
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

  const currentHp = character?.currentHp ?? 0;
  const maxHp = character?.maxHp ?? 1;
  const omens = character?.omens ?? 0;
  const currentTier = character?.equippedArmor?.currentTier ?? 0;
  const maxTier = character?.equippedArmor?.maxTier ?? 0;
  const hasArmor = !!character?.equippedArmor;
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
      updateArmorField('currentTier', newTier);
    }
  };

  const handleHpStep = (delta: number) => {
    const nextHp = Math.max(0, currentHp + delta);
    if (nextHp !== currentHp) {
      updateField('currentHp', nextHp);
    }
  };

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
                type="number"
                value={currentHp}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const parsedHp = parseInt(e.target.value, 10);
                  const safeHp = Number.isNaN(parsedHp) ? 0 : Math.max(0, parsedHp);
                  updateField('currentHp', safeHp);
                }}
                size="small"
                sx={{
                  ...customStyles.hpInput,
                  width: { xs: 56, sm: 50 },
                }}
                slotProps={{
                  htmlInput: {
                    "data-testid": "hp-input",
                    "aria-label": t('stats.hitPoints'),
                    min: 0,
                    step: 1,
                  }
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
                    cacheKey={`${characterKey}:resources:max-hp`}
                    durationMs={320}
                  />
                </Typography>
              </Box>
            </Box>

            <IconButton
              type="button"
              onClick={() => handleHpStep(-1)}
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
              onClick={() => handleHpStep(1)}
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
          <>
            <Button onClick={() => setDeathModalOpen(false)} variant="contained">
              {t('deathModal.close', 'Close')}
            </Button>
            <Button
              onClick={() => {
                setDeathModalOpen(false);
                killAndReplace();
              }}
              variant="contained"
              data-testid="death-modal-kill-button"
              sx={{
                backgroundColor: '#8b0000',
                color: morkBorgColors.yellow,
                '&:hover': {
                  backgroundColor: morkBorgColors.pink,
                  color: morkBorgColors.black,
                },
              }}
            >
              {t('deathModal.kill', 'Kill & Replace')}
            </Button>
          </>
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
