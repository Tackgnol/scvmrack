import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, CircularProgress, Collapse, Paper, TextField, Typography} from '@mui/material';
import {useState} from 'react';
import {customStyles} from '../theme/morkBorgTheme';
import {useTranslation} from 'react-i18next';
import { AddButton, ConfirmButton, CancelButton, BorderedContainer, BorderedGreyContainer } from './CharacterDescriptors.styled';

export const CharacterDescriptors = () => {
    const {character, isLoading, updateField, updateAbilities} = useCharacter();
    const {t} = useTranslation();
    const [newAbility, setNewAbility] = useState<{ name: string; description: string } | null>(null);

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

    const handleSaveNewAbility = () => {
        if (newAbility && (newAbility.name || newAbility.description)) {
            const newAbilities = [
                ...(character.abilities || []),
                newAbility
            ];
            updateAbilities(newAbilities);
            setNewAbility(null);
        }
    };

    const handleCancelNewAbility = () => {
        setNewAbility(null);
    };

    return (
        <>
            {/* Class Abilities */}
            <Paper sx={customStyles.characterDescriptors.paperWithRelative}>
                <Box sx={customStyles.characterDescriptors.headerRow}>
                    <Typography variant="subtitle2" color="secondary">
                        {t('character.classAbilities')}
                    </Typography>
                    <Box sx={customStyles.characterDescriptors.buttonGroup}>
                        <Collapse in={!newAbility} orientation="horizontal">
                            <AddButton onClick={() => setNewAbility({name: '', description: ''})}>
                                +
                            </AddButton>
                        </Collapse>
                        <Collapse in={!!newAbility} orientation="horizontal">
                            <Box sx={customStyles.characterDescriptors.buttonGroup}>
                                <ConfirmButton onClick={handleSaveNewAbility}>
                                    ✓
                                </ConfirmButton>
                                <CancelButton onClick={handleCancelNewAbility}>
                                    ✕
                                </CancelButton>
                            </Box>
                        </Collapse>
                    </Box>
                </Box>
                <BorderedContainer>
                    {/* New Ability Form */}
                    <Collapse in={!!newAbility}>
                        <Box sx={customStyles.characterDescriptors.newAbilityForm}>
                            <TextField
                                fullWidth
                                label={t('character.abilityName')}
                                value={newAbility?.name || ''}
                                onChange={(e) => setNewAbility({...newAbility!, name: e.target.value})}
                                variant="standard"
                                autoFocus
                                sx={{...customStyles.characterDescriptors.abilityNameField, ...customStyles.textField.standardYellow}}
                            />
                            <TextField
                                fullWidth
                                multiline
                                label={t('character.description')}
                                value={newAbility?.description || ''}
                                onChange={(e) => setNewAbility({...newAbility!, description: e.target.value})}
                                variant="standard"
                                sx={customStyles.textField.standard}
                            />
                        </Box>
                    </Collapse>

                    {/* Existing Abilities */}
                    {character.abilities && character.abilities.length > 0 ? (
                        character.abilities.map((ability, index) => (
                            <Box key={index}>
                                <TextField
                                    fullWidth
                                    label={t('character.abilityName')}
                                    value={ability.name}
                                    onChange={(e) => {
                                        const newAbilities = [...character.abilities!];
                                        newAbilities[index] = {...ability, name: e.target.value};
                                        updateAbilities(newAbilities);
                                    }}
                                    variant="standard"
                                    sx={{...customStyles.characterDescriptors.abilityNameField, ...customStyles.textField.standardYellow}}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    label={t('character.description')}
                                    value={ability.description}
                                    onChange={(e) => {
                                        const newAbilities = [...character.abilities!];
                                        newAbilities[index] = {...ability, description: e.target.value};
                                        updateAbilities(newAbilities);
                                    }}
                                    variant="standard"
                                    sx={customStyles.textField.standard}
                                />
                                {index < character.abilities!.length - 1 && (
                                    <Box sx={customStyles.characterDescriptors.abilitySeparator}/>
                                )}
                            </Box>
                        ))
                    ) : !newAbility ? (
                        <Typography variant="body2" sx={customStyles.characterDescriptors.emptyText}>
                            {t('character.noSpecialAbilities')}
                        </Typography>
                    ) : null}
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
                    />

                    <TextField
                        fullWidth
                        label={t('traits.trait2')}
                        value={character.trait2 || ''}
                        onChange={(e) => updateField('trait2', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
                    />

                    <TextField
                        fullWidth
                        label={t('traits.habit')}
                        value={character.habit || ''}
                        onChange={(e) => updateField('habit', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
                    />

                    <TextField
                        fullWidth
                        label={t('traits.bodyDescription')}
                        value={character.body_description || ''}
                        onChange={(e) => updateField('body_description', e.target.value)}
                        variant="standard"
                        sx={customStyles.textField.standard}
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
