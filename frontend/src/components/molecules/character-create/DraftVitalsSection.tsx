import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftRollButton, DraftSection, type SectionProps } from './DraftSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 },
  tile: {
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `2px solid ${morkBorgColors.black}`,
    boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    p: 1.25,
  },
  label: {
    display: 'block',
    color: morkBorgColors.black,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.68rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  value: {
    display: 'block',
    color: morkBorgColors.black,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '2.2rem',
    lineHeight: 1,
  },
};

function VitalValue({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Box sx={styles.tile}>
      <Typography component="span" sx={styles.label}>
        {label}
      </Typography>
      <Typography component="span" sx={styles.value}>
        {value}
      </Typography>
    </Box>
  );
}

export function DraftVitalsSection({ preview, rollingSection, busy, onReroll }: SectionProps) {
  const { t } = useTranslation();
  return (
    <DraftSection
      title={t('create.sections.vitals', 'Omens & Silver')}
      rolling={rollingSection === 'omens' || rollingSection === 'silver'}
      buttonRolling={rollingSection === 'omens'}
      disabled={busy}
      onReroll={() => onReroll('omens')}
      rerollLabel={t('create.rerollOmens', 'Re-roll omens')}
      testId="draft-vitals"
      die="d4"
      extraActions={
        <DraftRollButton
          testId="draft-vitals-reroll-silver"
          label={t('create.rerollSilver', 'Re-roll silver')}
          onClick={() => onReroll('silver')}
          disabled={busy}
          rolling={rollingSection === 'silver'}
          die="d10"
        />
      }
    >
      <Box sx={styles.grid}>
        <VitalValue label={t('create.omens', 'Omens')} value={preview.omens} />
        <VitalValue label={t('create.silver', 'Silver')} value={preview.silver} />
      </Box>
    </DraftSection>
  );
}
