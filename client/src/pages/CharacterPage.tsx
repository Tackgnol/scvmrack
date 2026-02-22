import {useCharacter} from "@/CharacterContext/CharacterContext";
import {BackpackSection, EquippedBar, Footer, ModifiersPanel, OnHandSection, PowersSection, SummaryBar} from "@/components";
import {Abilities} from "@components/Abilities";
import {CharacterDescriptors} from "@components/CharacterDescriptors";
import {CharacterNameAndClass} from "@components/CharacterNameAndClass";
import NotesSection from "@components/NoteSection";
import ResourcesRow from "@components/ResourceRow";
import {Seo} from '@/seo/Seo';

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

export function CharacterPage() {
    const {generateNew} = useCharacter();

    const handleNew = () => {
        generateNew()
    }

    return (
        <>
            <Seo
                title="Mork Borg Character Sheet Interactive"
                description="Scvm Grinder is a free interactive Mork Borg character sheet and generator. Create, edit, and save your Mörk Borg characters online."
                path="/"
                keywords={homeKeywords}
                jsonLd={homeStructuredData}
            />
            <SummaryBar/>
            <ResourcesRow/>
            <EquippedBar/>
            <CharacterNameAndClass/>
            <Abilities/>
            <CharacterDescriptors/>
            <ModifiersPanel/>
            <OnHandSection/>
            <BackpackSection/>
            <PowersSection/>
            <NotesSection/>
            <Footer
                onGenerateNew={handleNew}
            />
        </>
    );
}
