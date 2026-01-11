import {Box, TextField, Typography} from "@mui/material";
import {morkBorgColors} from "@theme/morkBorgTheme.ts";
import {ChangeEvent, useState} from "react";

export default function NotesSection() {
    // Notes aren't in the API yet - use local state for now
    // TODO: Add notes field to the API
    const [notes, setNotes] = useState('');

    return (
        <Box
            sx={{
                bgcolor: morkBorgColors.yellow,
                p: 2.5,
                boxShadow: `6px 6px 0 ${morkBorgColors.black}`,
                transform: 'rotate(0.2deg)',
                mb: 2.5,
            }}
        >
            <Typography
                sx={{
                    fontFamily: "'Permanent Marker', cursive",
                    fontSize: '1.3rem',
                    color: morkBorgColors.black,
                    mb: 1.25,
                }}
            >
                Notes & Miseries
            </Typography>
            <TextField
                placeholder="Scrawl your sins here..."
                value={notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                multiline
                rows={4}
                fullWidth
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: morkBorgColors.white,
                        border: `3px solid ${morkBorgColors.black}`,
                        '& fieldset': {border: 'none'},
                        '& textarea': {
                            color: morkBorgColors.black,
                        },
                    },
                }}
            />
        </Box>
    );
}
