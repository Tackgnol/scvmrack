import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, Paper, TextField, Typography} from "@mui/material";
import {morkBorgColors} from "@theme/morkBorgTheme.ts";
import {type ChangeEvent} from "react";

export default function ResourcesRow() {
    const {character, updateField} = useCharacter();

    // Armor tier is derived from equipped armor, not stored separately
    const armorTier = character?.equipped_armor?.max_tier ?? 0;

    const resources = [
        {
            label: 'Omens',
            value: character?.omens ?? 0,
            onChange: (v: string) => updateField('omens', parseInt(v) || 0),
            type: 'number' as const,
        },
        {
            label: 'Silver',
            value: character?.silver ?? 0,
            onChange: (v: string) => updateField('silver', parseInt(v) || 0),
            type: 'number' as const,
        },
        {
            label: 'Encumbrance',
            value: `${character?.equipment?.length ?? 0} / 8`,
            onChange: () => {
            },
            type: 'text' as const,
            readOnly: true,
        },
        {
            label: 'Armor Tier',
            value: armorTier,
            onChange: () => {
            },
            type: 'text' as const,
            readOnly: true,
        },
    ];

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)'},
                gap: 1.25,
                mb: 2.5,
            }}
        >
            {resources.map((resource) => (
                <Paper key={resource.label} sx={{p: 1.5, textAlign: 'center'}}>
                    <Typography variant="subtitle2" color="secondary" sx={{mb: 0.75, fontSize: '0.6rem'}}>
                        {resource.label}
                    </Typography>
                    <TextField
                        type={resource.type}
                        value={resource.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => resource.onChange(e.target.value)}
                        size="small"
                        slotProps={{input: {readOnly: resource.readOnly}}}
                        sx={{
                            width: 80,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: morkBorgColors.yellow,
                                '& input': {
                                    color: morkBorgColors.black,
                                    textAlign: 'center',
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '1.3rem',
                                    p: 0.75,
                                },
                                '& fieldset': {border: 'none'},
                            },
                        }}
                    />
                </Paper>
            ))}
        </Box>
    );
}
