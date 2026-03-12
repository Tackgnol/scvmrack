import {useCharacter} from "@/CharacterContext/CharacterContext";
import {BackpackSection, EquippedBar, Footer, ModifiersPanel, OnHandSection, PetSection, PowersSection, SummaryBar} from "@/components";
import MorkBorgModal, {ModalButton} from "@components/MorkBorgModal";
import {Abilities} from "@components/Abilities";
import {CharacterDescriptors} from "@components/CharacterDescriptors";
import {CharacterNameAndClass} from "@components/CharacterNameAndClass";
import NotesSection from "@components/NoteSection";
import ResourcesRow from "@components/ResourceRow";
import {Seo} from '@/seo/Seo';
import { customStyles, morkBorgColors } from "@/theme/morkBorgTheme";
import {Accordion, AccordionDetails, AccordionSummary, Typography, useMediaQuery, useTheme} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { keyframes } from '@mui/system';
import {useTranslation} from "react-i18next";
import { useEffect, useState, type ReactNode } from 'react';

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
    'Scvm Grinder',
];

const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            name: 'Scvm Grinder',
            inLanguage: ['en', 'pl'],
            description: 'Free interactive Mork Borg character sheet and generator.',
            keywords: homeKeywords.join(', '),
        },
        {
            '@type': 'WebApplication',
            name: 'Scvm Grinder',
            applicationCategory: 'GameApplication',
            operatingSystem: 'Any',
            isAccessibleForFree: true,
            genre: 'Tabletop RPG',
            description: 'Interactive Mork Borg character sheet and random character generator.',
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

const deathStampAnimation = keyframes`
    0% { opacity: 0; transform: translate(-50%, -8px) scale(0.96) rotate(-1deg); }
    20% { opacity: 1; transform: translate(-50%, 0) scale(1) rotate(-1deg); }
    70% { opacity: 1; transform: translate(-50%, 0) scale(1) rotate(-1deg); }
    100% { opacity: 0; transform: translate(-50%, 6px) scale(0.98) rotate(-1deg); }
`;

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
                expandIcon={<ExpandMoreIcon sx={customStyles.collapsibleSection.expandIcon} />}
                sx={customStyles.collapsibleSection.summary}
            >
                <Typography variant="subtitle2" color="secondary" sx={customStyles.collapsibleSection.title}>
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
    const {generateNew, error, character, characterId, isLoading} = useCharacter();
    const {t} = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const [deathStampVisible, setDeathStampVisible] = useState(false);

    const isNotFound = !!error && !character && !!characterId && !isLoading;
    const equipment = character?.equipment ?? [];
    const hasScrolls = equipment.some((item) => item.key?.startsWith('scroll.'));
    const hasPets = equipment.some((item) => {
        const tags = item.tags ?? [];
        const key = item.key ?? '';
        return tags.includes('pet') || key.startsWith('pet.') || key.startsWith('pets.');
    });
    const hasBackpack = (character?.storage ?? []).length > 0;
    const defaultExpanded = !isMobile;

    const handleNew = () => {
        setDeathStampVisible(true);
        generateNew()
    }

    useEffect(() => {
        if (!deathStampVisible) return;
        const timeoutId = window.setTimeout(() => setDeathStampVisible(false), 900);
        return () => window.clearTimeout(timeoutId);
    }, [deathStampVisible]);

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
            <Seo
                title="Mork Borg Character Sheet Interactive"
                description="Scvm Grinder is a free interactive Mork Borg character sheet and generator. Create, edit, and save your Mörk Borg characters online."
                path="/"
                keywords={homeKeywords}
                jsonLd={homeStructuredData}
            />
            {deathStampVisible && (
                <Typography
                    aria-hidden="true"
                    sx={{
                        position: 'fixed',
                        top: { xs: 74, sm: 92 },
                        left: '50%',
                        zIndex: 1400,
                        px: 2,
                        py: 0.6,
                        bgcolor: morkBorgColors.pink,
                        color: morkBorgColors.black,
                        border: `2px solid ${morkBorgColors.black}`,
                        boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
                        fontFamily: "'Antonio', sans-serif",
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        animation: prefersReducedMotion
                            ? 'none'
                            : `${deathStampAnimation} 900ms cubic-bezier(0.22, 1, 0.36, 1)`,
                        pointerEvents: 'none',
                    }}
                >
                    {t('characters.deathStamp', 'Scvm fell. Another crawls out.')}
                </Typography>
            )}
            <SummaryBar/>
            <ResourcesRow/>
            <EquippedBar/>
            <CharacterNameAndClass/>
            <Abilities/>
            <CharacterDescriptors/>
            <ModifiersPanel/>
            <OnHandSection/>
            {hasBackpack && (
                <SectionAccordion title={t('equipment.storedItems')} defaultExpanded={defaultExpanded}>
                    <BackpackSection showTitle={false}/>
                </SectionAccordion>
            )}
            {hasScrolls && (
                <SectionAccordion title={t('powers.title')} defaultExpanded={defaultExpanded}>
                    <PowersSection showLabel={false}/>
                </SectionAccordion>
            )}
            {hasPets && (
                <SectionAccordion title={t('pets.title')} defaultExpanded={defaultExpanded}>
                    <PetSection showLabel={false}/>
                </SectionAccordion>
            )}
            <NotesSection />
            <Footer
                onGenerateNew={handleNew}
            />
        </>
    );
}
