import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/** Confirmation shown in the separate forge tab after Owlbear binds the new scvm. */
export function ObrForgeComplete() {
  const { t } = useTranslation();

  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
      <Box>
        <Typography component="h1" variant="h3">{t('obr.forgeComplete.title', 'Forged. Back to Owlbear')}</Typography>
        <Typography sx={{ mt: 1 }}>{t('obr.forgeComplete.body', 'Your new scvm is bound to this Owlbear room.')}</Typography>
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.close()}>
          {t('obr.forgeComplete.back', 'Back to Owlbear')}
        </Button>
      </Box>
    </Box>
  );
}