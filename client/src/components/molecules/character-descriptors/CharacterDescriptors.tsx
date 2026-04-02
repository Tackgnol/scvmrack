import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import { useCharacterDescriptors } from '@/hooks/useCharacterDescriptors';
import ClassAbilitiesSection from '@components/molecules/character-descriptors/ClassAbilitiesSection';
import TraitsSection from '@components/molecules/character-descriptors/TraitsSection';
import OriginSection from '@components/molecules/character-descriptors/OriginSection';

export const CharacterDescriptors = () => {
  const { t } = useTranslation();
  const {
    character,
    isLoading,
    isOccultHerbmaster,
    abilities,
    updateAbilityComment,
    updateDescriptorField,
  } = useCharacterDescriptors();

  if (isLoading) {
    return (
      <Box sx={customStyles.loadingContainer}>
        <CircularProgress sx={customStyles.loadingSpinner} />
      </Box>
    );
  }

  if (!character) {
    return (
      <Paper sx={customStyles.emptyStatePaper}>
        <Typography color="secondary">{t('character.noCharacterLoaded')}</Typography>
      </Paper>
    );
  }

  return (
    <>
      <ClassAbilitiesSection
        abilities={abilities}
        isOccultHerbmaster={isOccultHerbmaster}
        onUpdateComment={updateAbilityComment}
      />

      <TraitsSection
        trait1={character.trait1}
        trait2={character.trait2}
        habit={character.habit}
        bodyDescription={character.bodyDescription}
        onChangeField={updateDescriptorField}
      />

      <OriginSection
        origin={character.origin}
        onChangeOrigin={(value) => updateDescriptorField('origin', value)}
      />
    </>
  );
};
