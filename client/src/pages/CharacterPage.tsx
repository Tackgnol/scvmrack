import {useCharacter} from "@/CharacterContext/CharacterContext";
import {BackpackSection, EquippedBar, Footer, ModifiersPanel, OnHandSection, PowersSection, SummaryBar} from "@/components";
import {Abilities} from "@components/Abilities";
import {CharacterDescriptors} from "@components/CharacterDescriptors";
import {CharacterNameAndClass} from "@components/CharacterNameAndClass";
import NotesSection from "@components/NoteSection";
import ResourcesRow from "@components/ResourceRow";

export function CharacterPage() {
    const {generateNew} = useCharacter();

    const handleNew = () => {
        generateNew()
    }

    return (
        <>
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
