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

export function ReleasePage() {
    const { t } = useTranslation();

    // Source of truth: the /release/*.md files at the repo root. Keep entries
    // newest-first and in sync with that folder when cutting a release.
    const releases: ReleaseNote[] = [
        {
            version: '0.3.4',
            date: '2026-06-07',
            type: 'patch',
            changes: [
                t('release.v034.authButtons', 'Account controls in the header are now clearly labeled buttons (Logged In / Log Out / Log In) instead of bare icons'),
                t('release.v034.listLocale', 'The character list and its dates now display consistently in English, matching the English-only app'),
            ],
        },
        {
            version: '0.3.3',
            date: '2026-06-07',
            type: 'patch',
            changes: [
                t('release.v033.firstRun', 'First run no longer creates a character before you accept the storage notice — an animated loading skeleton shows while your sheet is prepared'),
                t('release.v033.englishOnly', 'The language switcher is temporarily removed; the app is English-only for now while translations are reworked'),
                t('release.v033.faqCredit', 'Fixed the FAQ copyright credit to match the rest of the site'),
                t('release.v033.hardening', 'Hardening: utility URLs no longer return the app shell, plus a new production release checklist'),
            ],
        },
        {
            version: '0.3.2',
            date: '2026-06-06',
            type: 'patch',
            changes: [
                t('release.v032.editorSaves', 'The character sheet now saves reliably during fast, back-to-back edits — no more lost or reverted changes'),
                t('release.v032.inventory', 'Fixed unequipping armor and item edits; different items that share a name no longer merge into one stack'),
                t('release.v032.sharePreview', 'Shared links now show a proper preview card, and the site ships a sitemap for search engines'),
                t('release.v032.knownIssues', 'Added a "Known issues" section to the FAQ'),
                t('release.v032.internals', 'Backend restructured into clear layers and character generation hardened (no behavior change)'),
            ],
        },
        {
            version: '0.3.0',
            date: '2026-06-05',
            type: 'minor',
            changes: [
                t('release.v030.engine', 'Character generation now runs in-app via a seedable roller instead of database randomness'),
                t('release.v030.reads', 'Fetching and saving characters no longer depends on database stored procedures'),
                t('release.v030.alphaPrep', 'Internal cleanups ahead of the public alpha'),
            ],
        },
        {
            version: '0.2.1',
            date: '2026-05-31',
            type: 'patch',
            changes: [
                t('release.v021.alpha', 'Added an Alpha badge to the Scvmrack title'),
                t('release.v021.openSheet', 'Hardened Open Sheet so fast clicks use a safe bootstrap route'),
                t('release.v021.authorLink', 'Linked the Adam Kościelniak production credit'),
                t('release.v021.deployPackaging', 'Fixed deploy packaging to ship built frontend static files'),
            ],
        },
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
