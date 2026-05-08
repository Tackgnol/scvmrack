import { Paper, Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';

interface CharacterClassSummaryProps {
  label: string;
  className: string;
  classDescription?: string;
}

export default function CharacterClassSummary({
  label,
  className,
  classDescription,
}: CharacterClassSummaryProps) {
  return (
    <Paper sx={customStyles.characterClassPaper}>
      <Typography
        variant="subtitle2"
        color="secondary"
        sx={customStyles.characterClassLabel}
      >
        {label}
      </Typography>
      <Typography sx={customStyles.characterClassText}>{className}</Typography>
      {classDescription && (
        <Typography variant="body2" sx={customStyles.characterClassDescription}>
          {classDescription}
        </Typography>
      )}
    </Paper>
  );
}
