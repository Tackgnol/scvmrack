import { TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';
import { morkBorgColors } from '@/theme/morkBorgTheme';

export function DraftNameSection({ preview, rollingSection, busy, onReroll, onNameChange }: SectionProps) {
  const { t } = useTranslation();
  return (
    <DraftSection
      title={t('create.sections.name', 'Name')}
      rolling={rollingSection === 'name'}
      disabled={busy}
      onReroll={() => onReroll('name')}
      rerollLabel={t('create.rerollName', 'Re-roll name')}
      testId="draft-name"
      die="d20"
    >
      <TextField
        fullWidth
        value={preview.name ?? ''}
        placeholder={t('create.namePlaceholder', 'Name the wretch')}
        disabled={busy}
        onChange={(event) => onNameChange(event.target.value)}
        inputProps={{
          maxLength: 255,
          'aria-label': t('create.nameInputLabel', 'Character name'),
          'data-testid': 'draft-name-input',
        }}
        sx={{
          transform: 'rotate(0.35deg)',
          '& .MuiOutlinedInput-root': {
            bgcolor: morkBorgColors.yellow,
            color: morkBorgColors.black,
            borderRadius: 0,
            boxShadow: `5px 5px 0 ${morkBorgColors.pink}`,
            transition:
              'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1)',
            '& fieldset': {
              border: `3px solid ${morkBorgColors.black}`,
            },
            '&:hover': {
              transform: 'translate(-2px, -2px) rotate(-0.4deg)',
              boxShadow: `8px 8px 0 ${morkBorgColors.pink}`,
            },
            '&:hover fieldset': {
              borderColor: morkBorgColors.black,
            },
            '&.Mui-focused': {
              transform: 'translate(-2px, -2px) rotate(-0.4deg)',
              boxShadow: `8px 8px 0 ${morkBorgColors.black}`,
            },
            '&.Mui-focused fieldset': {
              borderColor: morkBorgColors.black,
            },
            '&.Mui-disabled': {
              bgcolor: morkBorgColors.yellow,
              opacity: 0.76,
            },
          },
          '& .MuiInputBase-input': {
            color: `${morkBorgColors.black} !important`,
            fontFamily: '"MedievalSharp", serif',
            fontSize: { xs: '2.1rem', sm: '2.65rem' },
            lineHeight: 1,
            px: { xs: 1.25, sm: 1.5 },
            py: { xs: 1.2, sm: 1.35 },
            textTransform: 'none',
          },
          '& .MuiInputBase-input::placeholder': {
            color: morkBorgColors.black,
            opacity: 0.72,
          },
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: morkBorgColors.black,
          },
        }}
      />
    </DraftSection>
  );
}
