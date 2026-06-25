import { useCharacter } from '@/CharacterContext/CharacterContext';
import { Abilities } from '@/components/organisms/Abilities';
import { BackpackSection } from '@/components/organisms/StorageSection';
import { CharacterDescriptors } from '@/components/molecules/character-descriptors/CharacterDescriptors';
import { CharacterNameAndClass } from '@/components/molecules/character/CharacterNameAndClass';
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
import {
    isConsumableUseItem,
    isPetItem,
    isScrollItem,
} from '@/hooks/useEquipmentSections';
import { customStyles } from '@/theme/morkBorgTheme';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
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
    const { character, isAuthenticated } = useCharacter();
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
