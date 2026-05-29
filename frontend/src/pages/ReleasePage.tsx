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
import {Seo} from '@/seo/Seo';

interface ReleaseNote {
    version: string;
    date: string;
    type: 'major' | 'minor' | 'patch';
    changes: string[];
}

export function ReleasePage() {
    const { t } = useTranslation();

    // Source of truth: the /release/*.md files at the repo root. Keep entries
    // newest-first and in sync with that folder when cutting a release.
    const releases: ReleaseNote[] = [
        {
            version: '0.2.0',
            date: '2026-05-29',
            type: 'minor',
            changes: [
                t('release.v020.feedback', 'Server-side feedback and crash reporting'),
                t('release.v020.errorDialog', 'Automatic dialog to report unexpected errors'),
                t('release.v020.apiErrors', 'Consistent, structured API error messages'),
                t('release.v020.tests', 'Hardened automated test suite (unit, integration, end-to-end)'),
                t('release.v020.tooling', 'Tooling fixes: green test run and a working linter'),
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
        <>
            <Seo
                title="Mork Borg Character Sheet Release Notes"
                description="Track Scvm Rack updates for the interactive Mork Borg character sheet, including new features, fixes, and gameplay tools."
                path="/release"
                keywords={[
                    'Mork Borg character sheet updates',
                    'Mork Borg release notes',
                    'Scvm Rack changelog',
                    'MÖRK BORG',
                ]}
            />
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
        </>
    );
}
