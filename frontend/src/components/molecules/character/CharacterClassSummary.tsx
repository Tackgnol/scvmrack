import { Box, Paper, Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface CharacterClassSummaryProps {
  label: string;
  className: string;
  classDescription?: string;
  classAttribution?: string;
  classAuthoredLanguage?: 'en' | 'pl' | null;
  classContentRemoved?: boolean;
  action?: ReactNode;
}

export default function CharacterClassSummary({
  label,
  className,
  classDescription,
  classAttribution,
  classAuthoredLanguage,
  classContentRemoved,
  action,
}: CharacterClassSummaryProps) {
  const { t } = useTranslation();

  return (
    <Paper sx={customStyles.characterClassPaper}>
      {action && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
          {action}
        </Box>
      )}
      <Typography
        variant="subtitle2"
        color="secondary"
        sx={{ ...customStyles.characterClassLabel, ...(action ? { pr: 12 } : {}) }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ ...customStyles.characterClassText, ...(action ? { pr: 12 } : {}) }}
      >
        {className}
      </Typography>
      {classAttribution && (
        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
          {classAttribution}
        </Typography>
      )}
      {classAuthoredLanguage && (
        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
          This class is written in {classAuthoredLanguage === 'en' ? 'English' : 'Polish'}.
        </Typography>
      )}
      {classContentRemoved && (
        <Typography variant="caption" display="block" color="error">
          {t('character.classContentRemoved')}
        </Typography>
      )}
      {classDescription && (
        <Typography variant="body2" sx={customStyles.characterClassDescription}>
          {classDescription}
        </Typography>
      )}
    </Paper>
  );
}
