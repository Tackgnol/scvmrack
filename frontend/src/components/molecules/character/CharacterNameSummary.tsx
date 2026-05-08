import { Box, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';

interface CharacterNameSummaryProps {
  label: string;
  name: string;
  trait1: string;
  trait2: string;
  classNameForTrait: string;
}

export default function CharacterNameSummary({
  label,
  name,
  trait1,
  trait2,
  classNameForTrait,
}: CharacterNameSummaryProps) {
  return (
    <Box sx={customStyles.characterNameBox}>
      <Typography variant="subtitle2" sx={customStyles.characterNameLabel}>
        {label}
      </Typography>
      <Typography sx={customStyles.characterNameText}>{name}</Typography>
      <Typography sx={customStyles.characterTraitText}>
        <Trans
          i18nKey="character.traitDescription"
          values={{
            trait1,
            trait2,
            className: classNameForTrait,
          }}
        />
      </Typography>
    </Box>
  );
}
