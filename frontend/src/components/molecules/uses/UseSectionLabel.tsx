import { customStyles } from '@/theme/morkBorgTheme';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface UseSectionLabelProps {
  title: string;
  hasPendingSave: boolean;
}

export default function UseSectionLabel({
  title,
  hasPendingSave,
}: UseSectionLabelProps) {
  const { t } = useTranslation();

  return (
    <Box sx={customStyles.powersSection.sectionLabel}>
      <Typography variant="h3" sx={{ color: 'inherit', font: 'inherit', p: 0, m: 0 }}>
        {title}
      </Typography>
      {hasPendingSave && (
        <Typography
          component="span"
          aria-live="polite"
          sx={customStyles.powersSection.savingIndicator}
        >
          {t('status.saving', 'Saving...')}
        </Typography>
      )}
    </Box>
  );
}
