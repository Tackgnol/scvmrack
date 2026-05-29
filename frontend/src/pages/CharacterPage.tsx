import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { Abilities } from '@/components/organisms/Abilities';
import { BackpackSection } from '@/components/organisms/StorageSection';
import { CharacterDescriptors } from '@/components/molecules/character-descriptors/CharacterDescriptors';
import { CharacterNameAndClass } from '@/components/molecules/character/CharacterNameAndClass';
import { OnHandSection } from '@/components/organisms/OnHandSection';
import {
    ConsumableSection,
    DeadStamp,
    EquippedBar,
    Footer,
    ModalButton,
    ModifiersPanel,
    MorkBorgModal,
    NoteSection,
    PetSection,
    PowersSection,
    ResourceRow,
    SummaryBar,
} from '@/components';
import {
    isConsumableUseItem,
    isPetItem,
    isScrollItem,
} from '@/hooks/useEquipmentSections';
import { Seo } from '@/seo/Seo';
import {
    shouldSkipKillConfirm,
    setSkipKillConfirm,
} from '@/preferences/killConfirmation';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import {
    getUserFacingApiErrorMessage,
    isApiForbidden,
    isApiNotFound,
    isApiUnauthorized,
    isUnexpectedApiError,
} from '@/utils/errorUtils';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Checkbox,
    FormControlLabel,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const homeKeywords = [
    'Mork Borg',
    'Mörk Borg',
    'Mork Borg character sheet',
    'Mörk Borg character sheet',
    'Mork Borg character sheet interactive',
    'Mörk Borg character sheet interactive',
    'Mork Borg character creator',
    'Mork Borg generator',
    'Mork Borg online sheet',
    'MORK BORG',
    'MÖRK BORG',
    'Scvm Rack',
];

const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            name: 'Scvm Rack',
            inLanguage: ['en', 'pl'],
            description: 'Free interactive Mork Borg character sheet and generator.',
            keywords: homeKeywords.join(', '),
        },
        {
            '@type': 'WebApplication',
            name: 'Scvm Rack',
            applicationCategory: 'GameApplication',
            operatingSystem: 'Any',
            isAccessibleForFree: true,
            genre: 'Tabletop RPG',
            description:
                'Interactive Mork Borg character sheet and random character generator.',
            about: {
                '@type': 'Thing',
                name: 'Mork Borg',
            },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
        },
    ],
};

const deathStampOverlayAnimation = keyframes`
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(2.6) rotate(-18deg);
        filter: blur(0.6px);
    }
    18% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.04) rotate(-12deg);
        filter: blur(0px);
    }
    70% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1) rotate(-12deg);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.02) rotate(-12deg);
    }
`;

const sheetImpactAnimation = keyframes`
    0% {
        transform: translateY(0) rotate(0deg);
        filter: none;
    }
    10% {
        transform: translateY(1px) rotate(-0.2deg);
        filter: saturate(0.95) contrast(1.05);
    }
    22% {
        transform: translateY(0) rotate(0.12deg);
    }
    34% {
        transform: translateY(0) rotate(0deg);
    }
    100% {
        transform: translateY(0) rotate(0deg);
        filter: none;
    }
`;

const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
});

function formatStampDate(d: Date) {
    const month = monthFormatter.format(d).toUpperCase();
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${month} ${day} ${year}`;
}

function SectionAccordion({
                              title,
                              children,
                              defaultExpanded,
                              dataTestId,
                          }: {
    title: string;
    children: ReactNode;
    defaultExpanded: boolean;
    dataTestId?: string;
}) {
    return (
        <Accordion
            defaultExpanded={defaultExpanded}
            disableGutters
            sx={customStyles.collapsibleSection.accordion}
            data-testid={dataTestId}
        >
            <AccordionSummary
                expandIcon={
                    <ExpandMoreIcon sx={customStyles.collapsibleSection.expandIcon} />
                }
                sx={customStyles.collapsibleSection.summary}
            >
                <Typography
                    variant="subtitle2"
                    color="secondary"
                    sx={customStyles.collapsibleSection.title}
                >
                    {title}
                </Typography>
            </AccordionSummary>
            <AccordionDetails sx={customStyles.collapsibleSection.details}>
                {children}
            </AccordionDetails>
        </Accordion>
    );
}

export function CharacterPage() {
    const {
        generateNew,
        killAndReplace,
        isAuthenticated,
        error,
        character,
        characterId,
        isLoading,
        isSessionExpired,
    } = useCharacter();

    const { t } = useTranslation();
    const { showUnexpectedError } = useErrorFeedback();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    const [killConfirmOpen, setKillConfirmOpen] = useState(false);
    const [killConfirmDontAskAgain, setKillConfirmDontAskAgain] = useState(false);
    const [stampDate, setStampDate] = useState<Date | null>(null);
    const [pendingAction, setPendingAction] = useState<'generate' | 'kill' | null>(null);
    const [fallbackUnexpectedLoadError, setFallbackUnexpectedLoadError] = useState(false);

    const hasLoadError = !isSessionExpired && !!error && !character && !!characterId && !isLoading;
    const isNotFound = hasLoadError && isApiNotFound(error);
    const isAccessDenied = hasLoadError && isApiForbidden(error);
    const hasKnownLoadIssue =
        hasLoadError &&
        !isNotFound &&
        !isAccessDenied &&
        (!isUnexpectedApiError(error) || fallbackUnexpectedLoadError);

    useEffect(() => {
        if (!hasLoadError || !isUnexpectedApiError(error)) {
            setFallbackUnexpectedLoadError(false);
            return;
        }

        const reported = showUnexpectedError(error, {
            source: 'character_page',
            operation: 'load_character',
            characterId,
        });
        setFallbackUnexpectedLoadError(!reported);
    }, [characterId, error, hasLoadError, showUnexpectedError]);

    const equipment = character?.equipment ?? [];

    const { hasScrolls, hasPets, hasConsumables } = useMemo(() => {
        return {
            hasScrolls: equipment.some(isScrollItem),
            hasPets: equipment.some(isPetItem),
            hasConsumables: equipment.some(isConsumableUseItem),
        };
    }, [equipment]);

    const hasBackpack = (character?.storage ?? []).length > 0;

    const defaultExpanded = !isMobile;

    const triggerStamp = () => {
        setStampDate(new Date());
    };

    const handleNew = () => {
        if (prefersReducedMotion) {
            if (isAuthenticated) {
                generateNew();
            } else {
                killAndReplace();
            }
            return;
        }

        setPendingAction(isAuthenticated ? 'generate' : 'kill');
        triggerStamp();
    };

    const performKill = () => {
        if (prefersReducedMotion) {
            killAndReplace();
            return;
        }

        setPendingAction('kill');
        triggerStamp();
    };

    const handleKillRequest = () => {
        // Honor the user's "Don't show this again" choice — kill straight away.
        if (shouldSkipKillConfirm()) {
            performKill();
            return;
        }

        setKillConfirmDontAskAgain(false);
        setKillConfirmOpen(true);
    };

    const handleKillConfirm = () => {
        if (killConfirmDontAskAgain) {
            setSkipKillConfirm(true);
        }

        setKillConfirmOpen(false);
        performKill();
    };

    return (
        <>
            <MorkBorgModal
                open={isNotFound}
                onClose={handleNew}
                title={t('characters.notFound')}
                closeOnBackdrop={false}
                showCloseButton={false}
                actions={
                    <ModalButton variant="primary" onClick={handleNew}>
                        {t('characters.generateNew')}
                    </ModalButton>
                }
            >
                <Typography>{t('characters.notFoundDescription')}</Typography>
            </MorkBorgModal>

            <MorkBorgModal
                open={isAccessDenied}
                onClose={handleNew}
                title={t(
                    'characters.accessDenied',
                    "You don't have access to this scvm"
                )}
                closeOnBackdrop={false}
                showCloseButton={false}
                actions={
                    <ModalButton variant="primary" onClick={handleNew}>
                        {t('characters.generateNew')}
                    </ModalButton>
                }
            >
                <Typography>
                    {t(
                        'characters.accessDeniedDescription',
                        'This scvm belongs to another session or account. Generate a new one or open one of yours.'
                    )}
                </Typography>
            </MorkBorgModal>

            <MorkBorgModal
                open={hasKnownLoadIssue}
                onClose={handleNew}
                title={
                    isApiUnauthorized(error)
                        ? t('errors.unauthorizedTitle', 'Session expired')
                        : t('characters.loadError', 'Failed to load character')
                }
                closeOnBackdrop={false}
                showCloseButton={false}
                actions={
                    <ModalButton variant="primary" onClick={handleNew}>
                        {t('characters.generateNew')}
                    </ModalButton>
                }
            >
                <Typography>
                    {getUserFacingApiErrorMessage(
                        error,
                        t,
                        'Failed to load character'
                    )}
                </Typography>
            </MorkBorgModal>

            <Seo
                title="Mork Borg Character Sheet Interactive"
                description="Scvm Rack is a free interactive Mork Borg character sheet and generator. Create, edit, and save your Mörk Borg characters online."
                path="/"
                keywords={homeKeywords}
                jsonLd={homeStructuredData}
            />

            {stampDate && (
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1500,
                        pointerEvents: 'none',
                    }}
                >
                    <Box
                        onAnimationEnd={() => {
                            setStampDate(null);

                            if (pendingAction === 'generate') {
                                generateNew();
                            } else if (pendingAction === 'kill') {
                                killAndReplace();
                            }

                            setPendingAction(null);
                        }}
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '46%',
                            width: 'min(92vw, 560px)',
                            opacity: 0,
                            transform: 'translate(-50%, -50%)',
                            mixBlendMode: 'multiply',
                            filter: 'drop-shadow(10px 12px 0 rgba(0,0,0,0.22))',
                            animation: prefersReducedMotion
                                ? 'none'
                                : `${deathStampOverlayAnimation} 900ms cubic-bezier(0.16, 1, 0.3, 1)`,
                        }}
                    >
                        <DeadStamp
                            mainText={t('characters.deadStampText', 'DEAD')}
                            date={formatStampDate(stampDate)}
                            mainColor={morkBorgColors.pink}
                            dateColor={morkBorgColors.white}
                        />
                    </Box>
                </Box>
            )}

            <Box
                className="print-sheet"
                sx={
                    stampDate && !prefersReducedMotion
                        ? {
                            transformOrigin: '50% 10%',
                            animation: `${sheetImpactAnimation} 520ms cubic-bezier(0.16, 1, 0.3, 1)`,
                        }
                        : undefined
                }
            >
                <Box>
                    <SummaryBar />
                    <ResourceRow />
                    <EquippedBar />
                </Box>
                <Box>
                    <CharacterNameAndClass />
                </Box>
                <Abilities />
                <CharacterDescriptors />

                <Box className="print-hidden" sx={customStyles.zoneDivider}>
                    <Typography sx={customStyles.zoneDividerIcon}>✠</Typography>
                </Box>

                <ModifiersPanel />
                <Box>
                    <OnHandSection />

                    {hasBackpack && (
                        <SectionAccordion
                            title={t('equipment.storedItems')}
                            defaultExpanded={defaultExpanded}
                        >
                            <BackpackSection showTitle={false} />
                        </SectionAccordion>
                    )}

                    {hasScrolls && (
                        <SectionAccordion
                            title={t('powers.title')}
                            defaultExpanded={defaultExpanded}
                        >
                            <PowersSection showLabel={false} />
                        </SectionAccordion>
                    )}

                    {hasPets && (
                        <SectionAccordion
                            title={t('pets.title')}
                            defaultExpanded={defaultExpanded}
                        >
                            <PetSection showLabel={false} />
                        </SectionAccordion>
                    )}

                    {hasConsumables && (
                        <SectionAccordion
                            title={t('consumables.title')}
                            defaultExpanded={defaultExpanded}
                        >
                            <ConsumableSection showLabel={false} />
                        </SectionAccordion>
                    )}
                </Box>

                <Box className="print-hidden" sx={customStyles.zoneDivider}>
                    <Typography sx={customStyles.zoneDividerIcon}>✠</Typography>
                </Box>

                <NoteSection />

                <Box className="print-hidden">
                    <Footer
                        onGenerateNew={handleNew}
                        generateNewLabel={
                            isAuthenticated ? undefined : t('actions.killScvm')
                        }
                        onKillScvm={isAuthenticated ? handleKillRequest : undefined}
                    />
                </Box>
            </Box>

            <MorkBorgModal
                open={killConfirmOpen}
                onClose={() => setKillConfirmOpen(false)}
                title={t('actions.killConfirmTitle', 'KILL THIS SCVM?')}
                maxWidth="xs"
                actions={
                    <>
                        <ModalButton
                            variant="secondary"
                            onClick={() => setKillConfirmOpen(false)}
                        >
                            {t('actions.cancel')}
                        </ModalButton>
                        <ModalButton
                            variant="danger"
                            onClick={handleKillConfirm}
                            data-testid="kill-confirm-button"
                        >
                            {t('actions.killConfirm', 'Kill & Replace')}
                        </ModalButton>
                    </>
                }
            >
                <Typography>
                    {t(
                        'actions.killConfirmDesc',
                        '"{{name}}" will be permanently deleted and a new scvm will crawl out.',
                        {
                            name: character?.name || t('character.unnamedWretch'),
                        }
                    )}
                </Typography>
                <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                        <Checkbox
                            checked={killConfirmDontAskAgain}
                            onChange={(event) =>
                                setKillConfirmDontAskAgain(event.target.checked)
                            }
                            data-testid="kill-confirm-dont-ask"
                        />
                    }
                    label={t(
                        'actions.killConfirmDontAskAgain',
                        "Don't show this again"
                    )}
                />
            </MorkBorgModal>
        </>
    );
}
