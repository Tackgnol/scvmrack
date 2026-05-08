import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, TextField, Typography} from "@mui/material";
import {customStyles} from "@theme/morkBorgTheme.ts";
import {ChangeEvent} from "react";
import {useTranslation} from 'react-i18next';


export default function NotesSection({ showTitle = true }: { showTitle?: boolean }) {
    const {t} = useTranslation();
    const {character, updateField} = useCharacter();
    const placeholderOptions = [
        t('notes.placeholder'),
        t('notes.placeholderAlt1', 'Scratches, oaths, debts.'),
        t('notes.placeholderAlt2', 'Scrawls from the abyss.'),
    ];
    const characterKey = character?.id ?? '';
    const placeholderIndex =
        placeholderOptions.length === 0
            ? 0
            : Math.abs(
                  Array.from(characterKey).reduce(
                      (sum, ch) => sum + ch.charCodeAt(0),
                      0
                  )
              ) % placeholderOptions.length;
    const placeholderText =
        placeholderOptions[placeholderIndex] ?? placeholderOptions[0];

    const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateField('notes', e.target.value);
    };

    return (
        <Box sx={customStyles.containers.notes}>
            {showTitle && (
                <Typography variant="h3" sx={customStyles.notes.title}>
                    {t('notes.title')}
                </Typography>
            )}
            <TextField
                placeholder={placeholderText}
                value={character?.notes ?? ''}
                onChange={handleNotesChange}
                onKeyDown={(event) => event.stopPropagation()}
                multiline
                rows={4}
                fullWidth
                sx={customStyles.notes.input}
                inputProps={{ "data-testid": "notes-input", maxLength: 10000 }}
            />
        </Box>
    );
}
