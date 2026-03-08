import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Ability} from "@/hooks/models.ts";
import {Box, CircularProgress, Paper, TextField, Typography} from '@mui/material';
import {customStyles} from '../theme/morkBorgTheme';
import {useTranslation} from 'react-i18next';
import {BorderedContainer, BorderedGreyContainer} from './CharacterDescriptors.styled';

export const CharacterDescriptors = () => {
    const {character, isLoading, updateField, updateAbilities} = useCharacter();
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
        <>
            {/* Class Abilities */}
            <Paper sx={customStyles.characterDescriptors.paperWithRelative}>
                <Box sx={customStyles.characterDescriptors.headerRow}>
                    <Typography variant="subtitle2" color="secondary">
                        {t('character.classAbilities')}
                    </Typography>
                </Box>
                <BorderedContainer>
                    {/* Existing Abilities */}
                    {character.abilities && character.abilities.length > 0 ? (
                        character.abilities.map((ability, index) => (
                            <Box key={index}>
                                <Typography variant="subtitle1" sx={customStyles.characterDescriptors.abilityNameField}>
                                    {ability.name}
                                </Typography>
                                <Typography variant="body2" sx={customStyles.textField.standard}>
                                    {ability.description}
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    label={t('modifiers.comment')}
                                    value={(ability as Ability).comment || ''}
                                    onChange={(e) => {
                                        const newAbilities = [...character.abilities!] as Ability[];
                                        newAbilities[index] = {...ability, comment: e.target.value};
                                        updateAbilities(newAbilities);
                                    }}
                                    placeholder={t('modifiers.commentPlaceholder')}
                                    variant="standard"
                                    sx={customStyles.textField.standard}
                                    inputProps={{ "data-testid": `ability-comment-${index}-input` }}
                                />
                                {index < character.abilities!.length - 1 && (
                                    <Box sx={customStyles.characterDescriptors.abilitySeparator}/>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" sx={customStyles.characterDescriptors.emptyText}>
                            {t('character.noSpecialAbilities')}
                        </Typography>
                    )}
                </BorderedContainer>
            </Paper>

            {/* Traits & Afflictions */}
            <Paper sx={customStyles.characterDescriptors.paper}>
                <Typography variant="subtitle2" color="secondary" sx={customStyles.characterDescriptors.sectionTitle}>
                    {t('traits.title')}
                </Typography>
                <BorderedGreyContainer>
                    <TextField
                        fullWidth
                        label={t('traits.trait1')}
                        value={character.trait1 || ''}
                        onChange={(e) => updateField('trait1', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
                        inputProps={{ "data-testid": "trait1-input" }}
                    />

                    <TextField
                        fullWidth
                        label={t('traits.trait2')}
                        value={character.trait2 || ''}
                        onChange={(e) => updateField('trait2', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
                        inputProps={{ "data-testid": "trait2-input" }}
                    />

                    <TextField
                        fullWidth
                        label={t('traits.habit')}
                        value={character.habit || ''}
                        onChange={(e) => updateField('habit', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
                        inputProps={{ "data-testid": "habit-input" }}
                    />

                    <TextField
                        fullWidth
                        label={t('traits.bodyDescription')}
                        value={character.body_description || ''}
                        onChange={(e) => updateField('body_description', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
                        inputProps={{ "data-testid": "body-description-input" }}
                    />
                </BorderedGreyContainer>
            </Paper>

            {/* Origin */}
            <Paper sx={customStyles.characterDescriptors.paper}>
                <Typography variant="subtitle2" color="secondary" sx={customStyles.characterDescriptors.sectionTitle}>
                    {t('character.origin')}
                </Typography>
                <BorderedContainer>
                    <TextField
                        fullWidth
                        multiline
                        value={character.origin || ''}
                        onChange={(e) => updateField('origin', e.target.value)}
                        placeholder={t('character.originPlaceholder')}
                        variant="standard"
                        sx={customStyles.textField.standardYellow}
                    />
                </BorderedContainer>
            </Paper>
        </>
    );
}
