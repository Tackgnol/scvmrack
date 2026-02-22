import {$api} from "@/api";
import {useAuth} from '@/hooks/useAuth';
import {useCharacterId} from '@/hooks/useCharacterId';
import {Seo} from '@/seo/Seo';
import { customStyles} from '@/theme/morkBorgTheme';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import {Link, useNavigate} from '@tanstack/react-router';
import {useTranslation} from 'react-i18next';


export function CharactersListPage() {
    const {t} = useTranslation();
    const {isAuthenticated, isGuest} = useAuth();
    const {setCharacterId} = useCharacterId();
    const navigate = useNavigate();

    const charactersQuery = $api.useQuery(
        'get',
        '/characters',
        {},
        {enabled: isAuthenticated}
    );

    // Redirect guests to home
    if (isGuest) {
        return (
            <>
                <Seo
                    title="Your Characters"
                    description="Private account page for saved Scvm Grinder characters."
                    path="/characters"
                    noIndex
                />
                <Box sx={customStyles.charactersListPage.guestWarning}>
                    <Alert
                        severity="warning"
                        sx={customStyles.alerts.warning}
                    >
                        {t('characters.loginRequired', 'You need to be logged in to view your characters.')}
                    </Alert>
                    <Button
                        component={Link}
                        to="/"
                        variant="contained"
                        sx={customStyles.charactersListPage.loginButton}
                    >
                        {t('common.backToHome', 'Back to Home')}
                    </Button>
                </Box>
            </>
        );
    }

    const handleSelectCharacter = (characterId: string) => {
        setCharacterId(characterId);
        navigate({to: '/'});
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Seo
                title="Your Characters"
                description="Private account page for saved Scvm Grinder characters."
                path="/characters"
                noIndex
            />
            <Box sx={customStyles.charactersListPage.container}>
                {/* Header */}
                <Box sx={customStyles.charactersListPage.header}>
                    <Typography variant="h4" sx={customStyles.pageTitle}>
                        {t('characters.title', 'Your Characters')}
                    </Typography>
                    <Button
                        component={Link}
                        to="/"
                        variant="outlined"
                        sx={customStyles.charactersListPage.backButton}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                </Box>

                {/* Loading */}
                {charactersQuery.isLoading && (
                    <Box sx={customStyles.charactersListPage.loadingBox}>
                        <CircularProgress sx={customStyles.charactersListPage.loadingSpinner}/>
                    </Box>
                )}

                {/* Error */}
                {charactersQuery.error && (
                    <Alert severity="error" sx={customStyles.charactersListPage.errorAlert}>
                        {t('characters.loadError', 'Failed to load characters')}
                    </Alert>
                )}

                {/* Empty state */}
                {charactersQuery.data?.length === 0 && (
                    <Box sx={customStyles.charactersListPage.emptyState}>
                        <Typography sx={customStyles.charactersListPage.emptyStateText}>
                            {t('characters.noCharacters', 'No characters yet. Create your first scvm!')}
                        </Typography>
                        <Button
                            component={Link}
                            to="/"
                            variant="contained"
                            sx={customStyles.charactersListPage.createButton}
                        >
                            {t('characters.createFirst', 'Create Character')}
                        </Button>
                    </Box>
                )}

                {/* Characters grid */}
                <Stack spacing={2}>
                    {charactersQuery.data?.map((character) => (
                        <Card key={character.id} sx={customStyles.characterCard}>
                            <CardActionArea onClick={() => character?.id && handleSelectCharacter(character.id)}>
                                <CardContent>
                                    <Box sx={customStyles.charactersListPage.cardContent}>
                                        <Box>
                                            <Typography variant="h5" sx={customStyles.charactersListPage.characterName}>
                                                {character.name}
                                            </Typography>
                                            <Typography sx={customStyles.charactersListPage.characterClass}>
                                                {character.class_name}
                                            </Typography>
                                        </Box>
                                        <Box sx={customStyles.charactersListPage.statsBox}>
                                            <Chip
                                                label={`HP: ${character.current_hp}/${character.max_hp}`}
                                                size="small"
                                                sx={{...customStyles.chips.hp, ...customStyles.charactersListPage.hpChip}}
                                            />
                                            <Typography sx={customStyles.charactersListPage.updateDate}>
                                                {formatDate(character.updated_at ?? '0')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                </Stack>
            </Box>
        </>
    );
}
