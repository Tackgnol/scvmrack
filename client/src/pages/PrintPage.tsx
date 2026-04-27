import { useCharacter } from '@/CharacterContext/CharacterContext';
import { CharacterDescriptors } from '@/components/molecules/character-descriptors/CharacterDescriptors';
import { CharacterNameAndClass } from '@/components/molecules/character/CharacterNameAndClass';
import NoteSection from '@/components/molecules/character/NoteSection';
import ConsumableSection from '@/components/molecules/consumables/ConsumableSection';
import EquippedBar from '@/components/molecules/equipped/EquippedBar';
import ModifiersPanel from '@/components/molecules/modifiers/ModifiersPanel';
import PowersSection from '@/components/molecules/PowersSection';
import ResourceRow from '@/components/molecules/ResourceRow';
import PetSection from '@/components/molecules/pets/PetSection';
import SummaryBar from '@/components/molecules/summary/SummaryBar';
import { Abilities } from '@/components/organisms/Abilities';
import { OnHandSection } from '@/components/organisms/OnHandSection';
import { BackpackSection } from '@/components/organisms/StorageSection';
import {
    isConsumableUseItem,
    isPetItem,
    isScrollItem,
} from '@/hooks/useEquipmentSections';
import { appHistory } from '@/router/history';
import { buildHomeCallbackUrl, buildPrintCallbackUrl } from '@/router/navigation';
import { Seo } from '@/seo/Seo';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function PrintPage() {
    const { character, characterId, lastCharacterId } = useCharacter();
    const { t } = useTranslation();

    const equipment = character?.equipment ?? [];
    const hasBackpack = (character?.storage ?? []).length > 0;
    const hasModifiers =
        (character?.computedModifiers ?? []).length > 0 ||
        (character?.modifiers ?? []).length > 0;

    const { hasScrolls, hasPets, hasConsumables } = useMemo(
        () => ({
            hasScrolls: equipment.some(isScrollItem),
            hasPets: equipment.some(isPetItem),
            hasConsumables: equipment.some(isConsumableUseItem),
        }),
        [equipment],
    );

    useEffect(() => {
        if (!characterId && lastCharacterId) {
            void appHistory.replace(buildPrintCallbackUrl(lastCharacterId));
        }
    }, [characterId, lastCharacterId]);

    const handleBack = () => {
        void appHistory.push(buildHomeCallbackUrl(characterId || lastCharacterId));
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Seo
                title="Printable Character Sheet"
                description="Printer friendly Mork Borg character sheet."
                path="/print"
                noIndex
            />
            <Box className="print-route-page">
                <Stack
                    className="print-toolbar print-hidden"
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    sx={{ mb: 2 }}
                >
                    <Button
                        variant="outlined"
                        onClick={handleBack}
                    >
                        {t('nav.home')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePrint}
                    >
                        {t('actions.print')}
                    </Button>
                </Stack>

                <Box className="print-sheet print-a4-sheet">
                    {!character ? (
                        <Box className="print-page-empty">
                            <Typography variant="h3">
                                {t('characters.notFound', 'Scvm not found')}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box className="print-page-masthead">
                                <Typography component="p" className="print-page-kicker">
                                    SCVMRACK
                                </Typography>
                                <Typography component="p" className="print-page-subtitle">
                                    {t('app.subtitle')}
                                </Typography>
                            </Box>

                            <Box className="print-page-top-grid">
                                <Box className="print-page-block print-page-identity">
                                    <CharacterNameAndClass />
                                </Box>
                                <Box className="print-page-block print-page-status">
                                    <SummaryBar />
                                    <ResourceRow />
                                    <EquippedBar />
                                </Box>
                            </Box>

                            <Box className="print-page-main-grid">
                                <Box className="print-page-column">
                                    <Box className="print-page-block">
                                        <Abilities />
                                    </Box>
                                    <Box className="print-page-block">
                                        <CharacterDescriptors />
                                    </Box>
                                    {hasModifiers && (
                                        <Box className="print-page-block">
                                            <ModifiersPanel />
                                        </Box>
                                    )}
                                </Box>

                                <Box className="print-page-column">
                                    <Box className="print-page-block">
                                        <OnHandSection />
                                    </Box>
                                    {hasBackpack && (
                                        <Box className="print-page-block">
                                            <BackpackSection />
                                        </Box>
                                    )}
                                    {hasScrolls && (
                                        <Box className="print-page-block">
                                            <PowersSection />
                                        </Box>
                                    )}
                                    {hasPets && (
                                        <Box className="print-page-block">
                                            <PetSection />
                                        </Box>
                                    )}
                                    {hasConsumables && (
                                        <Box className="print-page-block">
                                            <ConsumableSection />
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            <Box className="print-page-block print-page-notes">
                                <NoteSection />
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </>
    );
}
