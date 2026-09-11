import { useCharacter } from '@/CharacterContext/CharacterContext';
import { Abilities } from '@/components/organisms/Abilities';
import { BackpackSection } from '@/components/organisms/StorageSection';
import { CharacterDescriptors } from '@/components/molecules/character-descriptors/CharacterDescriptors';
import { CharacterNameAndClass } from '@/components/molecules/character/CharacterNameAndClass';
import MiseryTrack from '@/components/molecules/character/MiseryTrack';
import { OnHandSection } from '@/components/organisms/OnHandSection';
import {
    ConsumableSection,
    EquippedBar,
    Footer,
    ModifiersPanel,
    NoteSection,
    PetSection,
    PowersSection,
    ResourceRow,
    SummaryBar,
} from '@/components';
import { SectionAccordion } from '@/components/molecules/character/SectionAccordion';
import GettingBetterPanel from '@/components/organisms/getting-better/GettingBetterPanel';
import {
    isConsumableUseItem,
    isPetItem,
    isScrollItem,
} from '@/hooks/useEquipmentSections';
import { useGettingBetterPreview } from '@/hooks/useGettingBetterPreview';
import { customStyles } from '@/theme/morkBorgTheme';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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

const gettingBetterReveal = keyframes`
    0% {
        grid-template-rows: 0fr;
        opacity: 0;
        transform: translateY(-12px);
    }
    55% {
        opacity: 1;
    }
    100% {
        grid-template-rows: 1fr;
        opacity: 1;
        transform: translateY(0);
    }
`;

const gettingBetterReducedReveal = keyframes`
    from { opacity: 0.65; }
    to { opacity: 1; }
`;

type CharacterSheetProps = {
    stamping: boolean;
    onGenerateNew: () => void;
    onKillScvm: () => void;
    readOnly?: boolean;
};

export function CharacterSheet({
    stamping,
    onGenerateNew,
    onKillScvm,
    readOnly = false,
}: CharacterSheetProps) {
    const { t } = useTranslation();
    const { character, isAuthenticated, locale } = useCharacter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    const equipment = character?.equipment ?? [];
    const hasScrolls = equipment.some(isScrollItem);
    const hasPets = equipment.some(isPetItem);
    const hasConsumables = equipment.some(isConsumableUseItem);
    const hasBackpack = (character?.storage ?? []).length > 0;
    const defaultExpanded = !isMobile;
    const animateImpact = stamping && !prefersReducedMotion;
    const gettingBetter = useGettingBetterPreview({
        characterId: character?.id ?? null,
        locale,
    });
    const gettingBetterReady = Boolean(gettingBetter.workingDraft);
    const gettingBetterPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!gettingBetter.isOpen || !gettingBetterReady) return;

        const frame = requestAnimationFrame(() => {
            gettingBetterPanelRef.current?.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start',
            });
        });

        return () => cancelAnimationFrame(frame);
    }, [gettingBetter.isOpen, gettingBetterReady, prefersReducedMotion]);

    return (
        <Box
            className="print-sheet"
            sx={
                animateImpact
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
                <CharacterNameAndClass
                    classAction={
                        !readOnly && character?.id && !gettingBetter.isOpen ? (
                            <Button
                                data-testid="get-better-button"
                                onClick={gettingBetter.open}
                                sx={{
                                    ...customStyles.buttons.action,
                                    minHeight: 44,
                                }}
                            >
                                {t('gettingBetter.actions.open', 'Get better')}
                            </Button>
                        ) : undefined
                    }
                />
            </Box>
            {!readOnly && character?.id && (
                <Box className="print-hidden" sx={{ mb: 2.5 }}>
                    {gettingBetter.isOpen && (
                        <Box
                            ref={gettingBetterPanelRef}
                            sx={{ scrollMarginTop: { xs: 2, sm: 3 } }}
                        >
                            <Box
                                sx={
                                    gettingBetterReady
                                        ? {
                                            display: 'grid',
                                            gridTemplateRows: '1fr',
                                            transformOrigin: 'top center',
                                            animation: prefersReducedMotion
                                                ? `${gettingBetterReducedReveal} 140ms ease-out`
                                                : `${gettingBetterReveal} 480ms cubic-bezier(0.4, 0, 0.2, 1)`,
                                        }
                                        : undefined
                                }
                            >
                                <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                                    <GettingBetterPanel controller={gettingBetter} />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
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
                    <SectionAccordion title={t('powers.title')} defaultExpanded={defaultExpanded}>
                        <PowersSection showLabel={false} />
                    </SectionAccordion>
                )}

                {hasPets && (
                    <SectionAccordion title={t('pets.title')} defaultExpanded={defaultExpanded}>
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

            <MiseryTrack readOnly={readOnly} />
            <NoteSection />

            <Box className="print-hidden">
                {!readOnly && (
                    <Footer
                        onGenerateNew={onGenerateNew}
                        generateNewLabel={isAuthenticated ? undefined : t('actions.killScvm')}
                        onKillScvm={isAuthenticated ? onKillScvm : undefined}
                    />
                )}
            </Box>
        </Box>
    );
}
