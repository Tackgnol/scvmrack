import { Box, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';

interface OriginSectionProps {
  origin?: string;
  onChangeOrigin: (value: string) => void;
}

export default function OriginSection({
  origin,
  onChangeOrigin,
}: OriginSectionProps) {
  const { t } = useTranslation();

  return (
    <Box sx={customStyles.characterDescriptors.originOpen}>
      <Typography sx={customStyles.characterDescriptors.traitsLabel}>
        {t('character.origin')}
      </Typography>
      <Box sx={customStyles.characterDescriptors.originTextarea}>
        <TextField
          fullWidth
          multiline
          value={origin || ''}
          onChange={(event) => onChangeOrigin(event.target.value)}
          placeholder={t('character.originPlaceholder')}
          variant="standard"
          sx={customStyles.characterDescriptors.originPlaceholder}
        />
      </Box>
    </Box>
  );
}
