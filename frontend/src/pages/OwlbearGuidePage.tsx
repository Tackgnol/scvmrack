import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
    Box,
    Typography,
    Button,
    Divider,
} from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { Seo } from '@/seo/Seo';
import { getSiteUrl } from '@/seo/siteUrl';

interface OwlbearFeature {
    title: string;
    text: string;
    screenshotSrc: string;
    screenshotAlt: string;
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
    return (
        <Box sx={customStyles.owlbearPage.screenshot}>
            <Box
                component="img"
                src={src}
                alt={alt}
                loading="lazy"
                sx={customStyles.owlbearPage.screenshotImg}
            />
        </Box>
    );
}

function FeatureSection({ features }: { features: OwlbearFeature[] }) {
    return (
        <Box sx={customStyles.owlbearPage.featureList}>
            {features.map((feature, index) => (
                <Box key={feature.title}>
                    {index > 0 && <Divider sx={customStyles.owlbearPage.featureDivider} />}
                    <Box sx={{ ...customStyles.owlbearPage.feature, mt: index > 0 ? 3 : 0 }}>
                        <Typography variant="h4" sx={customStyles.owlbearPage.featureTitle}>
                            {feature.title}
                        </Typography>
                        <Typography sx={customStyles.owlbearPage.featureText}>
                            {feature.text}
                        </Typography>
                        <Screenshot src={feature.screenshotSrc} alt={feature.screenshotAlt} />
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

const buildPlayerFeatures = (t: TFunction): OwlbearFeature[] => [
    {
        title: t('owlbear.player.sheet.title', 'Your sheet, in the room'),
        text: t(
            'owlbear.player.sheet.text',
            'Open the Scvmrack action to see your scvm exactly as it is on the main site: stats, inventory, HP, Omens. Edit it without leaving Owlbear.'
        ),
        screenshotSrc: '/owlbear/ForPlayers1.png',
        screenshotAlt: t(
            'owlbear.player.sheet.screenshot',
            "The Scvmrack popover open in an Owlbear Rodeo room, showing a player's editable character sheet next to the map"
        ),
    },
    {
        title: t('owlbear.player.bind.title', 'Bind your token'),
        text: t(
            'owlbear.player.bind.text',
            "Select your token on the map and bind it to your scvm. The token's name label updates to show who it is, and you can re-bind it any time you switch scvms or tokens."
        ),
        screenshotSrc: '/owlbear/ForPlayers2.png',
        screenshotAlt: t(
            'owlbear.player.bind.screenshot',
            "The Scvmrack panel after selecting a token on the map, with the 'Bind to selected token' button ready"
        ),
    },
    {
        title: t('owlbear.player.peek.title', 'Peek any bound token'),
        text: t(
            'owlbear.player.peek.text',
            'Right-click a bound token for a compact card: HP, Omens, silver, combat targets, armor, gear, traits, and active modifiers. No need to open the full sheet.'
        ),
        screenshotSrc: '/owlbear/ForPlayers3.png',
        screenshotAlt: t(
            'owlbear.player.peek.screenshot',
            "A token's right-click menu with 'View scvm' selected, opening its compact card"
        ),
    },
];

const buildGmFeatures = (t: TFunction): OwlbearFeature[] => [
    {
        title: t('owlbear.gm.roster.title', 'The room roster, live'),
        text: t(
            'owlbear.gm.roster.text',
            'Every bound token shows up in your roster tab. HP, stats, and who is connected update as players play, with no refresh needed.'
        ),
        screenshotSrc: '/owlbear/ForGameMasters1.png',
        screenshotAlt: t(
            'owlbear.gm.roster.screenshot',
            'The GM roster listing bound characters with live HP and ability scores'
        ),
    },
    {
        title: t('owlbear.gm.promote.title', 'Promote the room to a party'),
        text: t(
            'owlbear.gm.promote.text',
            'Sign in and turn the room into a durable Scvmrack party. You get a manage link for yourself and an invite link for new players, and both keep working after the Owlbear session ends.'
        ),
        screenshotSrc: '/owlbear/ForGameMasters2.png',
        screenshotAlt: t(
            'owlbear.gm.promote.screenshot',
            'The GM roster with its generated invite link, after promoting the room to a Scvmrack party'
        ),
    },
    {
        title: t('owlbear.gm.enemies.title', 'Run the enemy board'),
        text: t(
            'owlbear.gm.enemies.text',
            'Add enemies from inside Owlbear and drop them onto tokens on the map. Players who click a bound enemy token see a read-only card; you keep the full editable version.'
        ),
        screenshotSrc: '/owlbear/ForGameMasters3.png',
        screenshotAlt: t(
            'owlbear.gm.enemies.screenshot',
            'The GM Enemies tab with a table threat, showing HP, morale, armor, and loot notes'
        ),
    },
];

export function OwlbearGuidePage() {
    const { t } = useTranslation();
    const manifestUrl = `${getSiteUrl()}/manifest.json`;
    const playerFeatures = buildPlayerFeatures(t);
    const gmFeatures = buildGmFeatures(t);

    return (
        <>
            <Seo
                title="Scvm Rack for Owlbear Rodeo"
                description="Run Scvm Rack inside Owlbear Rodeo: an in-room player sheet, live GM roster, party invites, and an enemy board for MÖRK BORG games."
                path="/owlbear"
                keywords={[
                    'Owlbear Rodeo extension',
                    'Mork Borg Owlbear Rodeo',
                    'Owlbear Rodeo character sheet',
                    'MÖRK BORG',
                    'Scvm Rack',
                ]}
            />
            <Box sx={customStyles.owlbearPage.container}>
                <Box sx={customStyles.owlbearPage.header}>
                    <Typography variant="h4" sx={customStyles.owlbearPage.title}>
                        {t('owlbear.title', 'Owlbear Rodeo')}
                    </Typography>
                    <Button
                        component={Link}
                        to="/"
                        variant="outlined"
                        sx={customStyles.owlbearPage.backButton}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                </Box>

                <Typography sx={customStyles.owlbearPage.intro}>
                    {t(
                        'owlbear.intro',
                        'Scvmrack runs inside Owlbear Rodeo as a room extension. Players keep their sheet open next to the map. Game masters get a live roster of every scvm at the table, without a second browser tab.'
                    )}
                </Typography>

                <Box sx={customStyles.owlbearPage.section}>
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={customStyles.owlbearPage.sectionHeading('-0.4deg')}
                    >
                        {t('owlbear.install.heading', 'Install')}
                    </Typography>
                    <Box sx={customStyles.owlbearPage.card}>
                        <Box component="ol" sx={customStyles.owlbearPage.stepList}>
                            <Box component="li" sx={customStyles.owlbearPage.stepItem}>
                                {t(
                                    'owlbear.install.step1',
                                    'Open your Owlbear Rodeo room and go to Settings → Manage Extensions.'
                                )}
                            </Box>
                            <Box component="li" sx={customStyles.owlbearPage.stepItem}>
                                {t('owlbear.install.step2', 'Paste this manifest URL and confirm:')}
                                <Box component="code" sx={customStyles.owlbearPage.manifestUrl}>
                                    {manifestUrl}
                                </Box>
                            </Box>
                            <Box component="li" sx={customStyles.owlbearPage.stepItem}>
                                {t(
                                    'owlbear.install.step3',
                                    "Scvmrack appears in the room's action bar. Click it to open the sheet."
                                )}
                            </Box>
                        </Box>
                        <Screenshot
                            src="/owlbear/Install1.png"
                            alt={t(
                                'owlbear.install.screenshot',
                                "Owlbear Rodeo's 'Add a custom extension' dialog with the Scvmrack manifest URL pasted into the Install Link field"
                            )}
                        />
                    </Box>
                </Box>

                <Box sx={customStyles.owlbearPage.section}>
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={customStyles.owlbearPage.sectionHeading('0.4deg')}
                    >
                        {t('owlbear.player.heading', 'For players')}
                    </Typography>
                    <Box sx={customStyles.owlbearPage.card}>
                        <FeatureSection features={playerFeatures} />
                    </Box>
                </Box>

                <Box sx={customStyles.owlbearPage.section}>
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={customStyles.owlbearPage.sectionHeading('-0.3deg')}
                    >
                        {t('owlbear.gm.heading', 'For game masters')}
                    </Typography>
                    <Box sx={customStyles.owlbearPage.card}>
                        <FeatureSection features={gmFeatures} />
                    </Box>
                </Box>

                <Box sx={customStyles.owlbearPage.footer}>
                    <Typography sx={customStyles.owlbearPage.footerText}>
                        {t(
                            'owlbear.morkBorgCredit',
                            'MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell. This is an independent fan project.'
                        )}
                    </Typography>
                </Box>
            </Box>
        </>
    );
}
