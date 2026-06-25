import { useRef, useState, type KeyboardEvent } from 'react';
import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SectionProps } from '@/components/molecules/character-create/DraftSection';
import { DraftNameSection } from '@/components/molecules/character-create/DraftNameSection';
import { DraftStatsSection } from '@/components/molecules/character-create/DraftStatsSection';
import { DraftAbilitiesSection } from '@/components/molecules/character-create/DraftAbilitiesSection';
import { DraftGearSection } from '@/components/molecules/character-create/DraftGearSection';
import { DraftVitalsSection } from '@/components/molecules/character-create/DraftVitalsSection';
import { DraftFlavorSection } from '@/components/molecules/character-create/DraftFlavorSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const styles = {
  // Bottom padding reserves room for the sticky CreateSummaryBar so it never
  // floats up over the step controls on short steps.
  root: {
    pt: 2,
    pb: { xs: 22 },
  },
  chip: {
    display: 'inline-block',
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `2px solid ${morkBorgColors.black}`,
    boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    fontFamily: '"Antonio", sans-serif',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    px: 1,
    py: 0.75,
    mb: 1.5,
  },
  controls: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 1,
    bgcolor: morkBorgColors.black,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
    mt: 1.5,
    p: 1,
  },
  navButton: {
    minHeight: 44,
    color: morkBorgColors.yellow,
    borderRadius: 0,
    fontFamily: '"Antonio", sans-serif',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    '&.Mui-disabled': {
      color: morkBorgColors.darkGrey,
    },
  },
  dotRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0.75,
  },
  dot: (active: boolean) => ({
    position: 'relative' as const,
    width: 28,
    height: 28,
    borderRadius: 0,
    display: 'grid',
    placeItems: 'center',
    // Invisible >=44px touch target centred on the 28px visual dot (WCAG 2.5.5)
    // without changing the dot's footprint or the row's visual rhythm.
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 44,
      height: 44,
    },
    '&::after': {
      content: '""',
      width: 10,
      height: 10,
      bgcolor: active ? morkBorgColors.pink : 'transparent',
      border: `2px solid ${active ? morkBorgColors.pink : morkBorgColors.white}`,
      transition: 'background-color 160ms, border-color 160ms',
    },
    '&:hover::after': {
      borderColor: morkBorgColors.yellow,
    },
    '&.Mui-focusVisible': {
      outline: `2px solid ${morkBorgColors.yellow}`,
      outlineOffset: '1px',
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&::after': { transition: 'none' },
    },
  }),
};

export function CreateSheetMobile(props: SectionProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { preview } = props;

  const steps = [
    { key: 'name', label: t('create.sections.name', 'Name'), node: <DraftNameSection {...props} /> },
    { key: 'stats', label: t('create.sections.stats', 'Stats & HP'), node: <DraftStatsSection {...props} /> },
    ...(preview.classId !== null
      ? [{ key: 'abilities', label: t('create.sections.abilities', 'Abilities'), node: <DraftAbilitiesSection {...props} /> }]
      : []),
    { key: 'gear', label: t('create.sections.gear', 'Gear'), node: <DraftGearSection {...props} /> },
    { key: 'vitals', label: t('create.sections.vitals', 'Omens & Silver'), node: <DraftVitalsSection {...props} /> },
    { key: 'flavor', label: t('create.sections.flavor', 'Flavor'), node: <DraftFlavorSection {...props} /> },
  ];

  const clampedStep = Math.min(step, steps.length - 1);
  const activeKey = steps[clampedStep].key;

  // Move selection AND focus together (activation-follows-focus), matching the
  // click behaviour. Focus the dot after the state update; the element persists.
  const focusStep = (index: number) => {
    setStep(index);
    dotRefs.current[index]?.focus();
  };

  const onDotKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = steps.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    focusStep(next);
  };

  return (
    <Box data-testid="create-sheet-mobile" sx={styles.root}>
      <Typography variant="body2" sx={styles.chip}>
        {preview.name} | HP {preview.maxHp} | {preview.silver}s
      </Typography>

      <Box
        role="tabpanel"
        id={`create-step-panel-${activeKey}`}
        aria-labelledby={`create-step-tab-${activeKey}`}
      >
        {steps[clampedStep].node}
      </Box>

      <Box sx={styles.controls}>
        <Button
          size="small"
          data-testid="create-step-back"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={clampedStep === 0}
          sx={styles.navButton}
        >
          {t('create.back', 'Back')}
        </Button>
        <Box sx={styles.dotRow} role="tablist" aria-label={t('create.stepNavLabel', 'Character sections')}>
          {steps.map((s, index) => (
            <ButtonBase
              key={s.key}
              ref={(el) => {
                dotRefs.current[index] = el;
              }}
              id={`create-step-tab-${s.key}`}
              data-testid={`create-step-dot-${s.key}`}
              role="tab"
              aria-selected={index === clampedStep}
              aria-controls={`create-step-panel-${s.key}`}
              aria-label={t('create.goToStep', 'Go to {{section}}', { section: s.label })}
              tabIndex={index === clampedStep ? 0 : -1}
              onClick={() => setStep(index)}
              onKeyDown={(event) => onDotKeyDown(event, index)}
              sx={styles.dot(index === clampedStep)}
            />
          ))}
        </Box>
        <Button
          size="small"
          data-testid="create-step-next"
          onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
          disabled={clampedStep === steps.length - 1}
          sx={styles.navButton}
        >
          {t('create.next', 'Next')}
        </Button>
      </Box>
    </Box>
  );
}
