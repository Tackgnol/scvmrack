import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, CircularProgress, Paper, Typography} from '@mui/material';
import {morkBorgColors, customStyles} from '../theme/morkBorgTheme';
import {Trans, useTranslation} from 'react-i18next';

export const CharacterNameAndClass = () => {
    const {character, isLoading} = useCharacter();
    const {t} = useTranslation();

    if (isLoading) {
        return (
            <Box sx={customStyles.loadingContainer}>
                <CircularProgress sx={customStyles.loadingSpinner}/>
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
        <Box sx={customStyles.characterNameClassGrid}>
            {/* Name */}
            <Box sx={customStyles.characterNameBox}>
                <Typography variant="subtitle2" sx={customStyles.characterNameLabel}>
                    {t('character.name')}
                </Typography>
                <Typography sx={customStyles.characterNameText}>
                    {character.name || t('character.unnamedWretch')}
                </Typography>
                <Typography sx={customStyles.characterTraitText}>
                    <Trans
                        i18nKey="character.traitDescription"
                        values={{
                            trait1: character.trait1 || t('character.mysterious'),
                            trait2: character.trait2 || t('character.unknown'),
                            className: character.class_name || t('character.wretch'),
                        }}
                    />
                </Typography>
            </Box>

            {/* Class */}
            <Paper sx={customStyles.characterClassPaper}>
                <Typography variant="subtitle2" color="secondary" sx={customStyles.characterClassLabel}>
                    {t('character.class')}
                </Typography>
                <Typography sx={customStyles.characterClassText}>
                    {character.class_name || t('character.classless')}
                </Typography>
                {character.class_description && (
                    <Typography variant="body2" sx={customStyles.characterClassDescription}>
                        {character.class_description}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}
