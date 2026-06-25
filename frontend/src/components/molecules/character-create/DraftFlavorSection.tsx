import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  DraftRollButton,
  DraftSection,
  type SectionProps,
} from './DraftSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const styles = {
  line: {
    bgcolor: morkBorgColors.grey,
    color: morkBorgColors.white,
    border: `1px solid ${morkBorgColors.darkGrey}`,
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: { xs: '0.98rem', sm: '1.03rem' },
    lineHeight: 1.36,
    p: { xs: 0.95, sm: 1.1 },
    mb: 0.75,
  },
  originBox: {
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `2px solid ${morkBorgColors.black}`,
    boxShadow: `3px 3px 0 ${morkBorgColors.darkGrey}`,
    p: { xs: 1.15, sm: 1.3 },
    mb: 1,
    transform: 'rotate(-0.18deg)',
  },
  originText: {
    color: morkBorgColors.black,
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: { xs: '1rem', sm: '1.06rem' },
    fontWeight: 700,
    fontStyle: 'italic' as const,
    lineHeight: 1.3,
  },
};

export function DraftFlavorSection({
  preview,
  rollingSection,
  busy,
  onReroll,
}: SectionProps) {
  const { t } = useTranslation();
  const lines = [
    preview.bodyDescription,
    preview.habit,
    preview.tale,
    [preview.trait1, preview.trait2].filter(Boolean).join(', '),
  ].filter((line): line is string => Boolean(line && line.length));

  return (
    <DraftSection
      title={t('create.sections.flavor', 'Flavor')}
      rolling={rollingSection === 'personality' || rollingSection === 'origin'}
      buttonRolling={rollingSection === 'personality'}
      disabled={busy}
      onReroll={() => onReroll('personality')}
      rerollLabel={t('create.rerollPersonality', 'Re-roll personality')}
      testId="draft-flavor"
      die="d20"
      extraActions={
        preview.classId !== null ? (
          <DraftRollButton
            testId="draft-flavor-reroll-origin"
            label={t('create.rerollOrigin', 'Re-roll origin')}
            onClick={() => onReroll('origin')}
            disabled={busy}
            rolling={rollingSection === 'origin'}
            die="d100"
          />
        ) : undefined
      }
    >
      {preview.origin && (
        <Box sx={styles.originBox}>
          <Typography sx={styles.originText}>{preview.origin}</Typography>
        </Box>
      )}
      {lines.map((line, index) => (
        <Typography key={`${line}-${index}`} sx={styles.line}>
          {line}
        </Typography>
      ))}
    </DraftSection>
  );
}
