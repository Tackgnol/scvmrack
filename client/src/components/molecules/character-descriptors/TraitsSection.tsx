import { Box, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';

interface TraitsSectionProps {
  trait1?: string;
  trait2?: string;
  habit?: string;
  bodyDescription?: string;
  onChangeField: (
    field: 'trait1' | 'trait2' | 'habit' | 'bodyDescription',
    value: string,
  ) => void;
}

export default function TraitsSection({
  trait1,
  trait2,
  habit,
  bodyDescription,
  onChangeField,
}: TraitsSectionProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h3" sx={customStyles.characterDescriptors.traitsHeading}>
        {t('traits.title')}
      </Typography>
      <Box sx={customStyles.characterDescriptors.traitsCard}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: { xs: 0.5, sm: 2 },
          }}
        >
          <Box sx={{ transform: 'rotate(0.3deg)' }}>
            <TextField
              fullWidth
              label={t('traits.trait1')}
              value={trait1 || ''}
              onChange={(event) => onChangeField('trait1', event.target.value)}
              variant="standard"
              sx={customStyles.characterDescriptors.traitsField}
              inputProps={{ 'data-testid': 'trait1-input' }}
            />
          </Box>
          <Box sx={{ transform: 'rotate(-0.4deg)' }}>
            <TextField
              fullWidth
              label={t('traits.trait2')}
              value={trait2 || ''}
              onChange={(event) => onChangeField('trait2', event.target.value)}
              variant="standard"
              sx={customStyles.characterDescriptors.traitsField}
              inputProps={{ 'data-testid': 'trait2-input' }}
            />
          </Box>
        </Box>
        <TextField
          fullWidth
          label={t('traits.habit')}
          value={habit || ''}
          onChange={(event) => onChangeField('habit', event.target.value)}
          variant="standard"
          sx={customStyles.characterDescriptors.traitsFieldHabit}
          inputProps={{ 'data-testid': 'habit-input' }}
        />
        <TextField
          fullWidth
          label={t('traits.bodyDescription')}
          value={bodyDescription || ''}
          onChange={(event) => onChangeField('bodyDescription', event.target.value)}
          variant="standard"
          sx={customStyles.characterDescriptors.traitsFieldHabit}
          inputProps={{ 'data-testid': 'body-description-input' }}
        />
      </Box>
    </Box>
  );
}
