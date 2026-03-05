import { $api } from "@/api";
import type { paths } from "@/api/schema.ts";
import { useCharacter } from "@/CharacterContext/CharacterContext";
import AnimatedNumber from "@components/AnimatedNumber.tsx";
import { useAuth } from '@/hooks/useAuth';
import { appHistory } from '@/router/history';
import { buildHomeCallbackUrl } from '@/router/navigation';
import { Seo } from '@/seo/Seo';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type CharactersListResponse = NonNullable<
    paths['/characters']['get']['responses']['200']['content']['application/json']
>;
type CharacterListItem = CharactersListResponse[number];

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
    shell: {
        border: `2px solid ${morkBorgColors.black}`,
        backgroundColor: '#0f0f0f',
    },
    tableHeader: {
        display: { xs: 'none', sm: 'grid' },
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr) 120px 180px 170px',
        gap: 2,
        px: 2,
        py: 1.25,
        borderBottom: `2px solid ${morkBorgColors.grey}`,
        backgroundColor: morkBorgColors.black,
    },
    tableHeaderCell: {
        fontFamily: '"Bebas Neue", sans-serif',
        color: morkBorgColors.yellow,
        letterSpacing: '0.08em',
        fontSize: '1rem',
        textTransform: 'uppercase' as const,
    },
    row: (isActive: boolean) => ({
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 2fr) minmax(0, 1.4fr) 120px 180px 170px' },
        gap: { xs: 1.25, sm: 2 },
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${morkBorgColors.grey}`,
        backgroundColor: isActive ? '#1a1a1a' : '#111',
        '&:last-child': {
            borderBottom: 0,
        },
    }),
    cell: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        gap: 0.5,
    },
    mobileLabel: {
        display: { xs: 'block', sm: 'none' },
        fontSize: '0.62rem',
        color: morkBorgColors.pink,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        fontFamily: '"Bebas Neue", sans-serif',
    },
    characterName: {
        fontFamily: '"Pirata One", serif',
        color: morkBorgColors.yellow,
        fontSize: { xs: '1.35rem', sm: '1.15rem' },
        lineHeight: 1.1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    text: {
        color: morkBorgColors.white,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    hpText: {
        color: morkBorgColors.white,
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: '1rem',
        letterSpacing: '0.04em',
    },
    dateText: {
        color: morkBorgColors.white,
        opacity: 0.75,
        fontSize: '0.85rem',
    },
    actions: {
        display: 'flex',
        justifyContent: { xs: 'stretch', sm: 'flex-end' },
        alignItems: 'center',
        flexDirection: { xs: 'row', sm: 'row' },
        gap: 1,
        minWidth: 0,
    },
    openButton: {
        flex: { xs: 1, sm: '0 0 auto' },
        minWidth: 78,
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
        borderRadius: 0,
        '&:hover': {
            bgcolor: morkBorgColors.white,
        },
    },
    deleteButton: {
        flex: { xs: 1, sm: '0 0 auto' },
        minWidth: 78,
        borderColor: morkBorgColors.pink,
        color: morkBorgColors.pink,
        borderRadius: 0,
        '&:hover': {
            borderColor: morkBorgColors.yellow,
            color: morkBorgColors.yellow,
            backgroundColor: 'rgba(255, 233, 0, 0.08)',
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
    const { isAuthenticated, isGuest } = useAuth();
    const { characterId, setCharacterId, generateNew } = useCharacter();
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const charactersQuery = $api.useQuery(
        'get',
        '/characters',
        {},
        { enabled: isAuthenticated, refetchOnMount: 'always' }
    );
    const deleteCharacter = $api.useMutation('delete', '/characters/{id}');

    const handleOpenCharacter = (id?: string) => {
        if (!id) return;
        void appHistory.push(buildHomeCallbackUrl(id));
    };

    const handleCreateNewCharacter = () => {
        if (isCreating) return;

        setDeleteError(null);
        setIsCreating(true);
        generateNew(undefined, {
            onSuccess: (newCharacterId) => {
                void appHistory.push(buildHomeCallbackUrl(newCharacterId));
            },
            onError: () => {
                setIsCreating(false);
                setDeleteError(t('characters.createError', 'Failed to create character'));
            },
        });
    };

    const handleDeleteCharacter = async (character: CharacterListItem) => {
        if (!character.id) return;

        const characterName = (character.name || '').trim() || t('characters.unnamed', 'Unnamed Scvm');
        const confirmed = window.confirm(
            t('characters.deleteConfirm', 'Delete "{{name}}"?', { name: characterName })
        );
        if (!confirmed) return;

        setDeleteError(null);
        setDeletingId(character.id);
        try {
            await deleteCharacter.mutateAsync({
                params: {
                    path: { id: character.id },
                },
            });

            if (character.id === characterId) {
                setCharacterId(null);
            }

            await charactersQuery.refetch();
        } catch {
            setDeleteError(t('characters.deleteError', 'Failed to delete character'));
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCharacterName = (character: CharacterListItem) =>
        (character.name || '').trim() || t('characters.unnamed', 'Unnamed Scvm');

    const getClassName = (character: CharacterListItem) =>
        (character.class_name || '').trim() || t('characters.unknownClass', 'Unknown');

    if (isGuest) {
        return (
            <>
                <Seo
                    title="Your Characters"
                    description="Private account page for saved Scvm Grinder characters."
                    path="/characters"
                    noIndex
                />
                <Box sx={listStyles.guestWarning}>
                    <Alert severity="warning" sx={customStyles.alerts.warning}>
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
                description="Private account page for saved Scvm Grinder characters."
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
                            onClick={handleCreateNewCharacter}
                            disabled={isCreating}
                        >
                            {isCreating
                                ? t('characters.creating', 'Creating...')
                                : t('actions.generateNew', 'Generate New')}
                        </Button>
                        <Button component={Link} to="/" variant="outlined" sx={listStyles.backButton}>
                            {t('common.back', 'Back')}
                        </Button>
                    </Box>
                </Box>

                {charactersQuery.isLoading && (
                    <Box sx={listStyles.loadingBox}>
                        <CircularProgress sx={listStyles.loadingSpinner} />
                    </Box>
                )}

                {charactersQuery.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {t('characters.loadError', 'Failed to load characters')}
                    </Alert>
                )}

                {deleteError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {deleteError}
                    </Alert>
                )}

                {charactersQuery.data?.length === 0 && (
                    <Box sx={listStyles.emptyState}>
                        <Typography sx={listStyles.emptyStateText}>
                            {t('characters.noCharacters', 'No characters yet. Create your first scvm!')}
                        </Typography>
                        <Button component={Link} to="/" variant="contained" sx={listStyles.createButton}>
                            {t('characters.createFirst', 'Create Character')}
                        </Button>
                    </Box>
                )}

                {Boolean(charactersQuery.data?.length) && (
                    <Box sx={listStyles.shell}>
                        <Box sx={listStyles.tableHeader}>
                            <Typography sx={listStyles.tableHeaderCell}>{t('characters.columns.name', 'Name')}</Typography>
                            <Typography sx={listStyles.tableHeaderCell}>{t('characters.columns.class', 'Class')}</Typography>
                            <Typography sx={listStyles.tableHeaderCell}>{t('characters.columns.hp', 'HP')}</Typography>
                            <Typography sx={listStyles.tableHeaderCell}>{t('characters.columns.updated', 'Updated')}</Typography>
                            <Typography sx={listStyles.tableHeaderCell}>{t('characters.columns.actions', 'Actions')}</Typography>
                        </Box>

                        <Stack spacing={0}>
                            {charactersQuery.data?.map((character, index) => {
                                const id = character.id || null;
                                const isActive = id !== null && id === characterId;
                                const isDeleting = deletingId !== null && id === deletingId;
                                const key = id ?? `${character.name ?? 'character'}-${index}`;

                                return (
                                    <Box key={key} sx={listStyles.row(isActive)}>
                                        <Box sx={listStyles.cell}>
                                            <Typography sx={listStyles.mobileLabel}>
                                                {t('characters.columns.name', 'Name')}
                                            </Typography>
                                            <Typography sx={listStyles.characterName}>{getCharacterName(character)}</Typography>
                                        </Box>

                                        <Box sx={listStyles.cell}>
                                            <Typography sx={listStyles.mobileLabel}>
                                                {t('characters.columns.class', 'Class')}
                                            </Typography>
                                            <Typography sx={listStyles.text}>{getClassName(character)}</Typography>
                                        </Box>

                                        <Box sx={listStyles.cell}>
                                            <Typography sx={listStyles.mobileLabel}>
                                                {t('characters.columns.hp', 'HP')}
                                            </Typography>
                                            <Typography sx={listStyles.hpText}>
                                                <AnimatedNumber
                                                    value={character.current_hp ?? 0}
                                                    cacheKey={`${character.id ?? key}:list:current-hp`}
                                                    durationMs={300}
                                                />
                                                {'/'}
                                                <AnimatedNumber
                                                    value={character.max_hp ?? 0}
                                                    cacheKey={`${character.id ?? key}:list:max-hp`}
                                                    durationMs={300}
                                                />
                                            </Typography>
                                        </Box>

                                        <Box sx={listStyles.cell}>
                                            <Typography sx={listStyles.mobileLabel}>
                                                {t('characters.columns.updated', 'Updated')}
                                            </Typography>
                                            <Typography sx={listStyles.dateText}>{formatDate(character.updated_at)}</Typography>
                                        </Box>

                                        <Box sx={listStyles.actions}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                sx={listStyles.openButton}
                                                onClick={() => handleOpenCharacter(character.id)}
                                                disabled={!character.id || isDeleting}
                                            >
                                                {t('characters.open', 'Open')}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={listStyles.deleteButton}
                                                onClick={() => handleDeleteCharacter(character)}
                                                disabled={!character.id || isDeleting}
                                            >
                                                {isDeleting
                                                    ? t('characters.deleting', 'Deleting...')
                                                    : t('characters.delete', 'Delete')}
                                            </Button>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>
        </>
    );
}
