import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Ability} from "@/hooks/models.ts";
import {Box, CircularProgress, Collapse, Paper, TextField, Typography, Button} from '@mui/material';
import {customStyles} from '../theme/morkBorgTheme';
import {useTranslation} from 'react-i18next';
import {useState} from 'react';
import DecoctionsModal from './DecoctionsModal';

const abilityRotations = [0.3, -0.2, 0.4, -0.3, 0.15];

function AbilityItem({ ability, index, onUpdateComment, isOccultHerbmaster }: {
    ability: Ability;
    index: number;
    onUpdateComment: (comment: string) => void;
    isOccultHerbmaster?: boolean;
}) {
    const {t} = useTranslation();
    const hasComment = Boolean(ability.comment);
    const [showComment, setShowComment] = useState(hasComment);
    const [showDecoctions, setShowDecoctions] = useState(false);
    const rotate = abilityRotations[index % abilityRotations.length];

    const isPortableLaboratory = ability.name?.toLowerCase().includes('portable laboratory') || 
                                 ability.name?.toLowerCase().includes('laboratorium przenośne');

    return (
        <Box
            sx={customStyles.characterDescriptors.abilityItem(rotate)}
            onClick={() => {
                if (showComment && !ability.comment) {
                    setShowComment(false);
                } else if (!showComment) {
                    setShowComment(true);
                }
            }}
        >
            <Typography sx={customStyles.characterDescriptors.abilityIndex}>
                {index + 1}
            </Typography>
            <Box sx={customStyles.characterDescriptors.abilityContent}>
                <Typography sx={customStyles.characterDescriptors.abilityName}>
                    {ability.name}
                </Typography>
                {ability.description && (
                    <Typography sx={customStyles.characterDescriptors.abilityDescription}>
                        {ability.description}
                    </Typography>
                )}
                
                {isOccultHerbmaster && isPortableLaboratory && (
                    <Box sx={{ mt: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDecoctions(true);
                            }}
                            sx={{
                                color: '#FF3EB5', // pink
                                borderColor: 'rgba(255, 62, 181, 0.5)',
                                fontFamily: "'Antonio', sans-serif",
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                '&:hover': {
                                    borderColor: '#FF3EB5',
                                    bgcolor: 'rgba(255, 62, 181, 0.1)',
                                }
                            }}
                        >
                            {t('abilities.occult_herbmaster.view_decoctions', 'VIEW DECOCTIONS')}
                        </Button>
                        <DecoctionsModal 
                            open={showDecoctions} 
                            onClose={() => setShowDecoctions(false)} 
                        />
                    </Box>
                )}

                <Collapse in={showComment}>
                    <TextField
                        fullWidth
                        multiline
                        size="small"
                        value={ability.comment || ''}
                        onChange={(e) => onUpdateComment(e.target.value)}
                        placeholder={t('modifiers.commentPlaceholder')}
                        variant="standard"
                        sx={customStyles.characterDescriptors.abilityComment}
                        inputProps={{ "data-testid": `ability-comment-${index}-input` }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Collapse>
            </Box>
        </Box>
    );
}

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

    const isOccultHerbmaster = character.class_id === 6;

    return (
        <>
            {/* Class Abilities */}
            <Box sx={{ mb: 1.5 }}>
                <Typography variant="h3" sx={customStyles.characterDescriptors.classAbilitiesHeading}>
                    {t('character.classAbilities')}
                </Typography>
                <Box sx={customStyles.characterDescriptors.classAbilitiesCard}>
                    {character.abilities && character.abilities.length > 0 ? (
                        <Box sx={customStyles.characterDescriptors.abilitiesList}>
                            {character.abilities.map((ability, index) => (
                                <AbilityItem
                                    key={index}
                                    ability={ability}
                                    index={index}
                                    isOccultHerbmaster={isOccultHerbmaster}
                                    onUpdateComment={(comment) => {
                                        const newAbilities = [...character.abilities!] as Ability[];
                                        newAbilities[index] = {...ability, comment};
                                        updateAbilities(newAbilities);
                                    }}
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

            {/* Traits & Afflictions */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h3" sx={customStyles.characterDescriptors.traitsHeading}>
                    {t('traits.title')}
                </Typography>
                <Box sx={customStyles.characterDescriptors.traitsCard}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 0.5, sm: 2 } }}>
                        <Box sx={{ transform: 'rotate(0.3deg)' }}>
                            <TextField
                                fullWidth
                                label={t('traits.trait1')}
                                value={character.trait1 || ''}
                                onChange={(e) => updateField('trait1', e.target.value)}
                                variant="standard"
                                sx={customStyles.characterDescriptors.traitsField}
                                inputProps={{ "data-testid": "trait1-input" }}
                            />
                        </Box>
                        <Box sx={{ transform: 'rotate(-0.4deg)' }}>
                            <TextField
                                fullWidth
                                label={t('traits.trait2')}
                                value={character.trait2 || ''}
                                onChange={(e) => updateField('trait2', e.target.value)}
                                variant="standard"
                                sx={customStyles.characterDescriptors.traitsField}
                                inputProps={{ "data-testid": "trait2-input" }}
                            />
                        </Box>
                    </Box>
                    <TextField
                        fullWidth
                        label={t('traits.habit')}
                        value={character.habit || ''}
                        onChange={(e) => updateField('habit', e.target.value)}
                        variant="standard"
                        sx={customStyles.characterDescriptors.traitsFieldHabit}
                        inputProps={{ "data-testid": "habit-input" }}
                    />
                    <TextField
                        fullWidth
                        label={t('traits.bodyDescription')}
                        value={character.body_description || ''}
                        onChange={(e) => updateField('body_description', e.target.value)}
                        variant="standard"
                        sx={customStyles.characterDescriptors.traitsFieldHabit}
                        inputProps={{ "data-testid": "body-description-input" }}
                    />
                </Box>
            </Box>

            {/* Origin */}
            <Box sx={customStyles.characterDescriptors.originOpen}>
                <Typography sx={customStyles.characterDescriptors.traitsLabel}>
                    {t('character.origin')}
                </Typography>
                <Box sx={customStyles.characterDescriptors.originTextarea}>
                    <TextField
                        fullWidth
                        multiline
                        value={character.origin || ''}
                        onChange={(e) => updateField('origin', e.target.value)}
                        placeholder={t('character.originPlaceholder')}
                        variant="standard"
                        sx={customStyles.characterDescriptors.originPlaceholder}
                    />
                </Box>
            </Box>
        </>
    );
}
