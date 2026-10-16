import { Box, Link as MuiLink, Paper, Typography } from '@mui/material';
import { Link, type RegisteredRouter } from '@tanstack/react-router';
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
  reportClassId?: number;
  /** A Custom Class's id; its name then links to the class's detail page. */
  detailClassId?: number;
  action?: ReactNode;
}

export default function CharacterClassSummary({
  label,
  className,
  classDescription,
  classAttribution,
  classAuthoredLanguage,
  classContentRemoved,
  reportClassId,
  detailClassId,
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
        {detailClassId ? (
          <MuiLink component={Link<RegisteredRouter, string, '/classes/$classId'>} to="/classes/$classId" params={{ classId: String(detailClassId) }} color="inherit">
            {className}
          </MuiLink>
        ) : (
          className
        )}
      </Typography>
      {classAttribution && (
        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
          {classAttribution}
        </Typography>
      )}
      {classAuthoredLanguage && (
        <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
          {t('character.classWrittenIn', 'This class is written in {{language}}.', {
            language: t(`classes.languages.${classAuthoredLanguage}`),
          })}
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
      {reportClassId && (
        <MuiLink
          component={Link}
          to="/report"
          search={{ classId: String(reportClassId) } as never}
          variant="body2"
          sx={{ display: 'inline-block', mt: 1 }}
        >
          {t('report.link', 'Report a class')}
        </MuiLink>
      )}
    </Paper>
  );
}
