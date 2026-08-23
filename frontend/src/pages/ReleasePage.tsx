import { Link } from '@tanstack/react-router';
import type { TFunction } from 'i18next';
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

const buildReleaseNotes = (t: TFunction): ReleaseNote[] => {
    // Source of truth: the /release/*.md files at the repo root. Keep entries
    // newest-first and in sync with that folder when cutting a release.
    return [
        {
            version: '0.6.0',
            date: '2026-08-24',
            type: 'minor',
            changes: [
                t('release.v060.beta', 'Scvmrack has entered Beta'),
                t('release.v060.miseries', 'Character sheets now include the seven-step Misery track, with controls for players and GMs'),
                t('release.v060.recovery', 'Missing, forbidden, and session-transition routes now recover cleanly without deleting character data or getting stuck'),
                t('release.v060.monitoring', 'GlitchTip now filters expected browser and API noise while preserving actionable release and source-map diagnostics'),
                t('release.v060.owlbear', 'Owlbear room visibility, enemy cards, token binding, and session handling are more reliable'),
            ],
        },
        {
            version: '0.5.7',
            date: '2026-07-06',
            type: 'patch',
            changes: [
                t('release.v057.obrVisibility', 'Owlbear room character visibility is now consistent across roster, enemy cards, and room APIs'),
                t('release.v057.obrTransport', 'The Owlbear panel now uses the app OpenAPI transport for consistent CSRF and session handling'),
                t('release.v057.obrManifestVersion', 'The OBR manifest now reports version 0.5.7'),
            ],
        },
        {
            version: '0.5.6',
            date: '2026-07-05',
            type: 'patch',
            changes: [
                t('release.v056.sharedOwlbearPackage', 'The Owlbear panel now runs on a shared, reusable package used across RPGTools apps — no behavior change for players'),
            ],
        },
        {
            version: '0.5.5',
            date: '2026-07-04',
            type: 'patch',
            changes: [
                t('release.v055.sharedAuthHandoff', 'The Owlbear Rodeo popup sign-in now runs on the shared RPGTools auth stack, the same audited flow used across all RPGTools apps'),
                t('release.v055.internalCleanup', 'Removed a leftover internal table that is no longer needed'),
            ],
        },
        {
            version: '0.5.4',
            date: '2026-06-30',
            type: 'patch',
            changes: [
                t('release.v054.obrEnemyTokenPopover', 'Player enemy cards now open from bound enemy token popovers instead of the character sheet'),
                t('release.v054.obrEnemySafeProjection', 'Player enemy popovers use the safe enemy-card projection while GM popovers keep the full editable form'),
                t('release.v054.obrManifestVersion', 'The OBR manifest now reports version 0.5.4'),
            ],
        },
        {
            version: '0.5.3',
            date: '2026-06-30',
            type: 'patch',
            changes: [
                t('release.v053.obrEnemyAutoSetup', 'The Owlbear Rodeo GM enemy tab now prepares its room enemy board automatically'),
                t('release.v053.obrEnemyNoLoginGate', 'GMs can add enemies from Owlbear without a scvmrack login or manual party promotion step'),
                t('release.v053.obrManifestVersion', 'The OBR manifest now reports version 0.5.3'),
            ],
        },
        {
            version: '0.5.2',
            date: '2026-06-30',
            type: 'patch',
            changes: [
                t('release.v052.obrManifestVersion', 'The OBR manifest now reports version 0.5.2'),
                t('release.v052.obrPopoverCacheBust', 'Owlbear Rodeo reloads the current extension entrypoint for player names, Forge/Login actions, and room enemy management'),
                t('release.v052.obrNoStore', 'The public OBR manifest and popover shell now send no-store cache headers'),
            ],
        },
        {
            version: '0.5.1',
            date: '2026-06-28',
            type: 'patch',
            changes: [
                t('release.v051.obrManifestCors', 'Owlbear Rodeo can install the Scvmrack manifest because the public extension files now send CORS headers'),
                t('release.v051.obrManifestVersion', 'The OBR manifest now reports version 0.5.1'),
            ],
        },
        {
            version: '0.5.0',
            date: '2026-06-28',
            type: 'minor',
            changes: [
                t('release.v050.obrExtension', 'Scvmrack now runs inside Owlbear Rodeo with an embedded player sheet and GM roster'),
                t('release.v050.tokenBinding', 'Players can bind or re-bind selected tokens, and bound selections show the scvm name'),
                t('release.v050.cardPeek', 'Bound tokens expose a compact View scvm card with HP, Omens, silver, combat targets, armor DR, gear, traits, and modifiers'),
                t('release.v050.roomPromotion', 'Signed-in GMs can move an Owlbear room into a durable scvmrack party with invite and manage links'),
                t('release.v050.drFiltering', 'Party and Owlbear warband rows now show armor DR and use the same modifier filtering as the main sheet'),
                t('release.v050.roomGate', 'OBR card reads are gated by the Owlbear room binding, so a leaked character id alone cannot fetch a card'),
            ],
        },
        {
            version: '0.4.4',
            date: '2026-06-25',
            type: 'patch',
            changes: [
                t('release.v044.structuredLogging', 'Unexpected backend errors now log full stack traces through the shared service error helper'),
                t('release.v044.sseCleanup', 'Party live-update streams now close half-open sockets when a write fails before the client disconnects'),
                t('release.v044.repositoryLayering', 'Catalog reads now go through repositories instead of direct database calls from library code'),
            ],
        },
        {
            version: '0.4.3',
            date: '2026-06-24',
            type: 'patch',
            changes: [
                t('release.v043.partyNameContrast', 'Party-name text on the GM overview now stays black on yellow so it remains readable while creating a party'),
                t('release.v043.partyNameLimit', 'Party creation now checks party names in the browser and blocks submit above 100 characters'),
                t('release.v043.localizedFeedback', 'The party-name validation message is localized in English and Polish'),
            ],
        },
        {
            version: '0.4.2',
            date: '2026-06-24',
            type: 'patch',
            changes: [
                t('release.v042.lanternConsumable', 'Lanterns and torches show up in the Consumables section with their use pips and count toward encumbrance again, instead of being treated as ammunition'),
                t('release.v042.sourcebookLink', 'The "Get the sourcebook" button now points to the Polish edition at nerdsirens.pl on the Polish view'),
                t('release.v042.translationCredit', 'Footer credits the official Polish translation by Nerd Sirens'),
            ],
        },
        {
            version: '0.4.1',
            date: '2026-06-23',
            type: 'patch',
            changes: [
                t('release.v041.itemSearch', 'Equipment search now returns Polish item names on the Polish view instead of English ones'),
                t('release.v041.dates', 'The character list now formats dates in the active language'),
                t('release.v041.partyEscape', 'A player whose only scvm is already in a party can now leave it — or roll a fresh scvm — straight from an invite link'),
                t('release.v041.livePulse', 'The GM warband strip gives a quiet, motion-safe flash on a scvm when its values change live'),
                t('release.v041.creationPolish', 'Creation flow: the re-roll button and stat names/abbreviations are localized, and re-rolling one section no longer flashes every button'),
                t('release.v041.langUrl', 'Opening /pl/... or /en/... sets the language, then continues to the page'),
            ],
        },
        {
            version: '0.4.0',
            date: '2026-06-23',
            type: 'minor',
            changes: [
                t('release.v040.parties', 'Game masters can create a party, share an invite link, and have players bind a scvm to the table'),
                t('release.v040.liveUpdates', 'The GM overview and player party view stream changes live — HP, stats, and who is connected — without refreshing'),
                t('release.v040.creation', 'A guided character creation flow: pick a class, go classless, or roll random, preview the scvm, re-roll any section, then forge it'),
                t('release.v040.polish', 'Polish is re-enabled with a redesigned header language toggle and broad localization across the app'),
            ],
        },
        {
            version: '0.3.5',
            date: '2026-06-07',
            type: 'patch',
            changes: [
                t('release.v035.characterUrls', 'Generating or selecting a scvm now lands on the clean /character/<id> URL without stale character query parameters'),
                t('release.v035.trailingSlash404', 'Opening /character/ now shows the 404 page instead of an empty app state'),
                t('release.v035.plainTextSaves', 'Character text saves now keep apostrophes and punctuation as typed instead of returning HTML entities'),
            ],
        },
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
};

export function ReleasePage() {
    const { t } = useTranslation();
    const releases = buildReleaseNotes(t);

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
                                    {release.changes.map((change) => (
                                        <Box component="li" key={`${release.version}-${change}`} sx={customStyles.releasePage.changeItem}>
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
