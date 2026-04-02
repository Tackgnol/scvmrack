import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import { type Ability } from '@/hooks/models';
import DescriptorAbilityItem from './DescriptorAbilityItem';

interface ClassAbilitiesSectionProps {
  abilities: Ability[];
  isOccultHerbmaster: boolean;
  onUpdateComment: (index: number, ability: Ability, comment: string) => void;
}

export default function ClassAbilitiesSection({
  abilities,
  isOccultHerbmaster,
  onUpdateComment,
}: ClassAbilitiesSectionProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="h3" sx={customStyles.characterDescriptors.classAbilitiesHeading}>
        {t('character.classAbilities')}
      </Typography>
      <Box sx={customStyles.characterDescriptors.classAbilitiesCard}>
        {abilities.length > 0 ? (
          <Box sx={customStyles.characterDescriptors.abilitiesList}>
            {abilities.map((ability, index) => (
              <DescriptorAbilityItem
                key={index}
                ability={ability}
                index={index}
                isOccultHerbmaster={isOccultHerbmaster}
                onUpdateComment={(comment) => onUpdateComment(index, ability, comment)}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={customStyles.characterDescriptors.emptyText}>
            {t('character.noSpecialAbilities')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
