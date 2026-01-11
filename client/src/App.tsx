import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Header} from "@/components";
import {Abilities} from "@components/Abilities.tsx";
import {CharacterDescriptors} from "@components/CharacterDescriptors.tsx";
import {CharacterNameAndClass} from "@components/CharacterNameAndClass.tsx";
import NotesSection from "@components/NoteSection.tsx";
import ResourcesRow from "@components/ResourceRow.tsx";
import {Box, Container, CssBaseline, TextField, ThemeProvider, Typography,} from '@mui/material';
import {useState} from 'react';

// Components
import {
    BackpackSection,
    EquippedBar,
    Footer,
    ModalButton,
    ModifiersPanel,
    MorkBorgModal,
    OnHandSection,
    PowersSection,
    SummaryBar,
} from './components';

import {morkBorgColors, morkBorgTheme} from './theme/morkBorgTheme';

// Global styles
import './styles/global.css';


export default function App() {
    const [modalOpen, setModalOpen] = useState(false);
    const {generateNew} = useCharacter();

    return (

        <ThemeProvider theme={morkBorgTheme}>
            <CssBaseline/>
            <Box sx={{bgcolor: morkBorgColors.yellow, minHeight: '100vh', py: 2}}>
                <Container maxWidth="md">
                    <Header/>
                    <SummaryBar/>
                    <ResourcesRow/>
                    <EquippedBar/>
                    <CharacterNameAndClass/>
                    <Abilities/>
                    <CharacterDescriptors/>

                    <ModifiersPanel/>
                    {/*<EquipmentSection/>*/}
                    <OnHandSection/>
                    <BackpackSection/>
                    <PowersSection/>
                    <NotesSection/>
                    <Footer
                        onOpenModal={() => setModalOpen(true)}
                        onGenerateNew={() => generateNew()}
                    />
                </Container>
            </Box>

            {/* Demo Modal */}
            <MorkBorgModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Rest for the Wicked"
                actions={
                    <>
                        <ModalButton variant="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </ModalButton>
                        <ModalButton variant="primary" onClick={() => setModalOpen(false)}>
                            Rest
                        </ModalButton>
                    </>
                }
            >
                <Typography sx={{color: morkBorgColors.white, mb: 2}}>
                    You find a moment of respite in this dying world. What do you do?
                </Typography>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    <TextField label="Hours of Rest" type="number" defaultValue={6} fullWidth/>
                    <TextField label="Location" select SelectProps={{native: true}} fullWidth>
                        <option>Abandoned ruins</option>
                        <option>Cursed forest</option>
                        <option>Roadside ditch</option>
                        <option>Tavern (if silver permits)</option>
                    </TextField>
                </Box>
            </MorkBorgModal>
        </ThemeProvider>
    );
}
