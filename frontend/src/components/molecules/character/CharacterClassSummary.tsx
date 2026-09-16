import { Box, Paper, Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import type { ReactNode } from 'react';

interface CharacterClassSummaryProps {
  label: string;
  className: string;
  classDescription?: string;
  action?: ReactNode;
}

export default function CharacterClassSummary({
  label,
  className,
  classDescription,
  action,
}: CharacterClassSummaryProps) {
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
      {classDescription && (
        <Typography variant="body2" sx={customStyles.characterClassDescription}>
          {classDescription}
        </Typography>
      )}
    </Paper>
  );
}
