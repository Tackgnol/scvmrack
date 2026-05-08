import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@theme/morkBorgTheme.ts';
import { AbilityCardsGrid } from '@components/index';

export const Abilities = () => {
  const { t } = useTranslation();

  return (
    <Box sx={customStyles.abilities.container}>
      <Typography variant="h3" sx={customStyles.abilities.title}>
        {t('character.abilities')}
      </Typography>
      <AbilityCardsGrid />
    </Box>
  );
};
