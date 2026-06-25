import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';

// The draft API gives abilities a `name` and an optional `description`. Some
// entries are a titled ability (short name + description); others are a bare
// block of rules prose stuffed into `name` with no description. We can't tell
// the two apart from a flag, so we infer prose from shape: no description AND a
// label that reads like a sentence rather than a heading (long, or punctuated).
function looksLikeRulesText(label: string, hasDescription: boolean): boolean {
  if (hasDescription) return false;
  return label.length > 52 || /[.;!?]/.test(label);
}

const abilityCardStyle = (index: number, isRulesText: boolean) => ({
  bgcolor: isRulesText ? morkBorgColors.white : morkBorgColors.yellow,
  color: morkBorgColors.black,
  border: `3px solid ${morkBorgColors.black}`,
  boxShadow: `4px 4px 0 ${index % 2 === 0 ? morkBorgColors.yellow : morkBorgColors.pink}`,
  p: { xs: 1.25, sm: 1.45 },
  mb: 1.25,
  transform: index % 2 === 0 ? 'rotate(-0.25deg)' : 'rotate(0.22deg)',
});

const abilityTitleStyle = (isRulesText: boolean) => ({
  display: isRulesText ? 'block' : 'inline-block',
  bgcolor: isRulesText ? 'transparent' : morkBorgColors.black,
  color: isRulesText ? morkBorgColors.black : morkBorgColors.yellow,
  border: isRulesText ? 0 : `2px solid ${morkBorgColors.black}`,
  fontFamily: isRulesText
    ? '"Alegreya", Georgia, serif'
    : '"Bebas Neue", sans-serif',
  fontSize: isRulesText
    ? { xs: '1rem', sm: '1.05rem' }
    : { xs: '1.35rem', sm: '1.5rem' },
  fontWeight: isRulesText ? 700 : 400,
  letterSpacing: isRulesText ? 0 : '0.04em',
  lineHeight: isRulesText ? 1.3 : 1,
  textTransform: isRulesText ? 'none' : 'uppercase',
  px: isRulesText ? 0 : 0.8,
  py: isRulesText ? 0 : 0.5,
});

export function DraftAbilitiesSection({
  preview,
  rollingSection,
  busy,
  onReroll,
}: SectionProps) {
  const { t } = useTranslation();
  const abilities = preview.abilities ?? [];

  if (preview.classId === null && abilities.length === 0) {
    return null;
  }

  return (
    <DraftSection
      title={t('create.sections.abilities', 'Abilities')}
      rolling={rollingSection === 'abilities'}
      disabled={busy}
      onReroll={() => onReroll('abilities')}
      rerollLabel={t('create.rerollAbilities', 'Re-roll abilities')}
      testId="draft-abilities"
      die="d12"
    >
      {abilities.map((ability, index) => {
        const label = ability.name ?? ability.key ?? '';
        const isRulesText = looksLikeRulesText(
          label,
          Boolean(ability.description),
        );

        return (
          <Box
            key={ability.key ?? ability.name}
            sx={abilityCardStyle(index, isRulesText)}
          >
            <Typography
              component={isRulesText ? 'p' : 'h3'}
              sx={{
                ...abilityTitleStyle(isRulesText),
                mb: ability.description ? 0.9 : 0,
              }}
            >
              {label}
            </Typography>
            {ability.description && (
              <Typography
                sx={{
                  color: morkBorgColors.black,
                  fontFamily: '"Alegreya", Georgia, serif',
                  fontSize: { xs: '1rem', sm: '1.05rem' },
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                {ability.description}
              </Typography>
            )}
          </Box>
        );
      })}
    </DraftSection>
  );
}
