import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { CharacterNameSummary, CharacterClassSummary } from '@components/index';
import { useCharacterNameAndClass } from '@/hooks/useCharacterNameAndClass';
import { getCharacterViewTransitionName } from '@/router/routeClassification';
import type { ReactNode } from 'react';

type CharacterNameAndClassProps = {
  classAction?: ReactNode;
};

export const CharacterNameAndClass = ({ classAction }: CharacterNameAndClassProps) => {
  const {
    character,
    isLoading,
    hasCharacter,
    noCharacterLoadedText,
    nameLabel,
    classLabel,
    fallbackName,
    fallbackTrait1,
    fallbackTrait2,
    fallbackTraitClass,
    fallbackClassName,
  } = useCharacterNameAndClass();

  if (isLoading) {
    return (
      <Box sx={customStyles.loadingContainer}>
        <CircularProgress sx={customStyles.loadingSpinner} />
      </Box>
    );
  }

  if (!hasCharacter || !character) {
    return (
      <Paper sx={customStyles.emptyStatePaper}>
        <Typography color="secondary">{noCharacterLoadedText}</Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        ...customStyles.characterNameClassGrid,
        viewTransitionName: getCharacterViewTransitionName(character.id),
      }}
    >
      <CharacterNameSummary
        label={nameLabel}
        name={character.name || fallbackName}
        trait1={character.trait1 || fallbackTrait1}
        trait2={character.trait2 || fallbackTrait2}
        classNameForTrait={character.className || fallbackTraitClass}
      />

      <CharacterClassSummary
        label={classLabel}
        className={character.className || fallbackClassName}
        classDescription={character.classDescription ?? undefined}
        action={classAction}
      />
    </Box>
  );
};
