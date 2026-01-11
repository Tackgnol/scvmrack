import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, Paper, TextField, Typography} from "@mui/material";
import {customStyles} from "@theme/morkBorgTheme.ts";
import {type ChangeEvent} from "react";
import {useTranslation} from 'react-i18next';

export default function ResourcesRow() {
    const {character, updateField} = useCharacter();
    const {t} = useTranslation();

    // Armor tier is derived from equipped armor, not stored separately
    const armorTier = character?.equipped_armor?.max_tier ?? 0;

    const resources = [
        {
            label: t('stats.omens'),
            value: character?.omens ?? 0,
            onChange: (v: string) => updateField('omens', parseInt(v) || 0),
            type: 'number' as const,
        },
        {
            label: t('stats.silver'),
            value: character?.silver ?? 0,
            onChange: (v: string) => updateField('silver', parseInt(v) || 0),
            type: 'number' as const,
        },
        {
            label: t('stats.encumbrance'),
            value: `${character?.equipment?.length ?? 0} / 8`,
            onChange: () => {
            },
            type: 'text' as const,
            readOnly: true,
        },
        {
            label: t('stats.armorTier'),
            value: armorTier,
            onChange: () => {
            },
            type: 'text' as const,
            readOnly: true,
        },
    ];

    return (
        <Box sx={customStyles.resourceRow.container}>
            {resources.map((resource) => (
                <Paper key={resource.label} sx={customStyles.resourceRow.paper}>
                    <Typography variant="subtitle2" color="secondary" sx={customStyles.resourceRow.label}>
                        {resource.label}
                    </Typography>
                    <TextField
                        type={resource.type}
                        value={resource.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => resource.onChange(e.target.value)}
                        size="small"
                        slotProps={{input: {readOnly: resource.readOnly}}}
                        sx={customStyles.resourceInput}
                    />
                </Paper>
            ))}
        </Box>
    );
}
