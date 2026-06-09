import { useCharactersList } from '@/hooks/useCharactersList';
import { CharacterTable } from '@components/molecules/characters-list/CharacterTable';
import { useAuth } from '@/hooks/useAuth';
import { appHistory } from '@/router/history';
import { buildHomeCallbackUrl } from '@/router/navigation';
import { Seo } from '@/seo/Seo';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

const handleOpenCharacter = async (id?: string) => {
    if (!id) return;
    const targetPath = buildHomeCallbackUrl(id);
    const result = await appHistory.push(targetPath);
    // History writes are throttled internally; flush to avoid stale route/query reads.
    appHistory.flush();

    if (result.type === 'BLOCKED') {
        window.location.assign(targetPath);
    }
};

const listStyles = {
    container: {
        py: 2,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 2,
    },
    headerActions: {
        display: 'flex',
        gap: 1,
        alignItems: 'center',
    },
    newButton: {
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
        borderRadius: 0,
        '&:hover': {
            bgcolor: morkBorgColors.yellow,
        },
    },
    backButton: {
        borderColor: morkBorgColors.black,
        color: morkBorgColors.black,
        '&:hover': {
            bgcolor: morkBorgColors.black,
            color: morkBorgColors.yellow,
        },
    },
    loadingBox: {
        display: 'flex',
        justifyContent: 'center',
        py: 4,
    },
    loadingSpinner: {
        color: morkBorgColors.black,
    },
    emptyState: {
        textAlign: 'center' as const,
        py: 4,
    },
    emptyStateText: {
        color: morkBorgColors.black,
        mb: 2,
    },
    createButton: {
        bgcolor: morkBorgColors.pink,
        '&:hover': { bgcolor: morkBorgColors.yellow },
    },
    guestWarning: {
        py: 4,
    },
};

export function CharactersListPage() {
    const { t } = useTranslation();
    const { isGuest } = useAuth();
    const {
        characters,
        activeId,
        backUrl,
        isLoading,
        loadError,
        deleteError,
        isCreating,
        deletingId,
        createNew,
        remove,
    } = useCharactersList();

    if (isGuest) {
        return (
            <>
                <Seo
                    title="Your Characters"
                    description="Private account page for saved Scvm Rack characters."
                    path="/characters"
                    noIndex
                />
                <Box sx={listStyles.guestWarning}>
                    <Alert data-testid="characters-guest-warning" severity="warning" sx={customStyles.alerts.warning}>
                        {t('characters.loginRequired', 'You need to be logged in to view your characters.')}
                    </Alert>
                    <Button component={Link} to="/" variant="contained" sx={customStyles.charactersListPage.loginButton}>
                        {t('common.backToHome', 'Back to Home')}
                    </Button>
                </Box>
            </>
        );
    }

    return (
        <>
            <Seo
                title="Your Characters"
                description="Private account page for saved Scvm Rack characters."
                path="/characters"
                noIndex
            />

            <Box sx={listStyles.container}>
                <Box sx={listStyles.header}>
                    <Typography variant="h4" sx={customStyles.pageTitle}>
                        {t('characters.title', 'Your Characters')}
                    </Typography>
                    <Box sx={listStyles.headerActions}>
                        <Button
                            variant="contained"
                            sx={listStyles.newButton}
                            onClick={createNew}
                            disabled={isCreating}
                        >
                            {isCreating
                                ? t('characters.creating', 'Creating...')
                                : t('actions.generateNew', 'Generate New')}
                        </Button>
                        <Button
                            variant="outlined"
                            sx={listStyles.backButton}
                            onClick={() => appHistory.push(backUrl)}
                        >
                            {t('common.back', 'Back')}
                        </Button>
                    </Box>
                </Box>

                {isLoading && (
                    <Box sx={listStyles.loadingBox}>
                        <CircularProgress sx={listStyles.loadingSpinner} />
                    </Box>
                )}

                {loadError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {getUserFacingApiErrorMessage(
                            loadError,
                            t,
                            'Failed to load characters'
                        )}
                    </Alert>
                )}

                {deleteError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {deleteError}
                    </Alert>
                )}

                {characters.length === 0 && (
                    <Box sx={listStyles.emptyState}>
                        <Typography sx={listStyles.emptyStateText}>
                            {t('characters.noCharacters', 'No characters yet. Create your first scvm!')}
                        </Typography>
                        <Button component={Link} to={buildHomeCallbackUrl(null)} variant="contained" sx={listStyles.createButton}>
                            {t('characters.createFirst', 'Create Character')}
                        </Button>
                    </Box>
                )}

                {characters.length > 0 && (
                    <CharacterTable
                        characters={characters}
                        activeId={activeId}
                        deletingId={deletingId}
                        onOpen={handleOpenCharacter}
                        onDelete={remove}
                    />
                )}
            </Box>
        </>
    );
}
