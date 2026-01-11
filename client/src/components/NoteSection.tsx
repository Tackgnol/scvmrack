import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, TextField, Typography} from "@mui/material";
import {customStyles} from "@theme/morkBorgTheme.ts";
import {ChangeEvent} from "react";
import {useTranslation} from 'react-i18next';


export default function NotesSection() {
    const {t} = useTranslation();
    const {character, updateField} = useCharacter();

    const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateField('notes', e.target.value);
    };

    return (
        <Box sx={customStyles.containers.notes}>
            <Typography sx={customStyles.notes.title}>
                {t('notes.title')}
            </Typography>
            <TextField
                placeholder={t('notes.placeholder')}
                value={character?.notes ?? ''}
                onChange={handleNotesChange}
                multiline
                rows={4}
                fullWidth
                sx={customStyles.notes.input}
            />
        </Box>
    );
}
