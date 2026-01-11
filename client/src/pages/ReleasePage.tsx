import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
} from '@mui/material';
import { morkBorgColors, customStyles } from '@/theme/morkBorgTheme';

interface ReleaseNote {
    version: string;
    date: string;
    type: 'major' | 'minor' | 'patch';
    changes: string[];
}

export function ReleasePage() {
    const { t } = useTranslation();

    // Release notes - could be fetched from an API in the future
    const releases: ReleaseNote[] = [
        {
            version: '1.0.0',
            date: '2026-01-20',
            type: 'major',
            changes: [
                t('release.v100.auth', 'User accounts with email verification'),
                t('release.v100.magicLink', 'Magic link login'),
                t('release.v100.guestSessions', 'Guest sessions with 7-day persistence'),
                t('release.v100.characterClaim', 'Claim guest characters after signup'),
                t('release.v100.multiChar', 'Multiple characters per account'),
                t('release.v100.i18n', 'Polish and English language support'),
            ],
        },
        {
            version: '0.9.0',
            date: '2026-01-15',
            type: 'minor',
            changes: [
                t('release.v090.equipment', 'Equipment management system'),
                t('release.v090.powers', 'Powers and scrolls tracking'),
                t('release.v090.notes', 'Character notes section'),
                t('release.v090.autoSave', 'Auto-save with debouncing'),
            ],
        },
        {
            version: '0.8.0',
            date: '2026-01-10',
            type: 'minor',
            changes: [
                t('release.v080.generator', 'Random character generator'),
                t('release.v080.classes', 'All core MÖRK BORG classes'),
                t('release.v080.stats', 'Stat tracking and modifiers'),
                t('release.v080.theme', 'MÖRK BORG-inspired dark theme'),
            ],
        },
    ];

    const getTypeColor = (type: ReleaseNote['type']) => {
        switch (type) {
            case 'major':
                return morkBorgColors.pink;
            case 'minor':
                return morkBorgColors.yellow;
            case 'patch':
                return morkBorgColors.white;
        }
    };

    const getTypeLabel = (type: ReleaseNote['type']) => {
        switch (type) {
            case 'major':
                return t('release.typeMajor', 'Major');
            case 'minor':
                return t('release.typeMinor', 'Minor');
            case 'patch':
                return t('release.typePatch', 'Patch');
        }
    };

    return (
        <Box sx={customStyles.releasePage.container}>
            {/* Header */}
            <Box sx={customStyles.releasePage.header}>
                <Typography variant="h4" sx={customStyles.releasePage.title}>
                    {t('release.title', 'Release Notes')}
                </Typography>
                <Button
                    component={Link}
                    to="/"
                    variant="outlined"
                    sx={customStyles.releasePage.backButton}
                >
                    {t('common.back', 'Back')}
                </Button>
            </Box>

            {/* Release Cards */}
            <Box sx={customStyles.releasePage.cardsContainer}>
                {releases.map((release) => (
                    <Card key={release.version} sx={customStyles.releasePage.card}>
                        <CardContent>
                            {/* Version header */}
                            <Box sx={customStyles.releasePage.versionHeader}>
                                <Box sx={customStyles.releasePage.versionInfo}>
                                    <Typography variant="h5" sx={customStyles.releasePage.versionNumber}>
                                        v{release.version}
                                    </Typography>
                                    <Chip
                                        label={getTypeLabel(release.type)}
                                        size="small"
                                        sx={customStyles.releasePage.typeChip(release.type, getTypeColor(release.type))}
                                    />
                                </Box>
                                <Typography sx={customStyles.releasePage.date}>
                                    {new Date(release.date).toLocaleDateString()}
                                </Typography>
                            </Box>

                            {/* Changes list */}
                            <Box component="ul" sx={customStyles.releasePage.changesList}>
                                {release.changes.map((change, index) => (
                                    <Box component="li" key={index} sx={customStyles.releasePage.changeItem}>
                                        {change}
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Footer */}
            <Box sx={customStyles.releasePage.footer}>
                <Typography sx={customStyles.releasePage.footerText}>
                    {t('release.moreUpdates', 'More updates coming soon. The world is ending, but we keep shipping.')}
                </Typography>
            </Box>
        </Box>
    );
}
