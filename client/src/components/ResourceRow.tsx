import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, IconButton, Paper, TextField, Typography} from "@mui/material";
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import {customStyles} from "@theme/morkBorgTheme.ts";
import {type ChangeEvent} from "react";
import {useTranslation} from 'react-i18next';

export default function ResourcesRow() {
    const {character, updateField, updateArmorField} = useCharacter();
    const {t} = useTranslation();

    const currentHp = character?.current_hp ?? 0;
    const maxHp = character?.max_hp ?? 1;
    const currentTier = character?.equipped_armor?.current_tier ?? 0;
    const maxTier = character?.equipped_armor?.max_tier ?? 0;
    const hasArmor = !!character?.equipped_armor;

    const handleTierChange = (delta: number) => {
        const newTier = Math.max(0, Math.min(maxTier, currentTier + delta));
        if (newTier !== currentTier) {
            updateArmorField('current_tier', newTier);
        }
    };

    const resources = [
        {
            label: t('stats.omens'),
            value: character?.omens ?? 0,
            onChange: (v: string) => updateField('omens', parseInt(v) || 0),
        },
        {
            label: t('stats.silver'),
            value: character?.silver ?? 0,
            onChange: (v: string) => updateField('silver', parseInt(v) || 0),
        },
    ];

    return (
        <Box sx={customStyles.resourceRow.container}>
            {/* HP — special layout with current / max */}
            <Paper sx={customStyles.resourceRow.paper}>
                <Typography variant="subtitle2" color="secondary" sx={customStyles.resourceRow.label}>
                    {t('stats.hitPoints')}
                </Typography>
                <Box sx={customStyles.hpContainer}>
                    <TextField
                        type="number"
                        value={currentHp}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateField('current_hp', parseInt(e.target.value) || 0)
                        }
                        size="small"
                        sx={customStyles.hpInput}
                    />
                    <Typography sx={customStyles.hpDivider}>/</Typography>
                    <Box sx={customStyles.maxHpBox}>
                        <Typography sx={customStyles.maxHpText}>{maxHp}</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Omens, Silver — simple number inputs */}
            {resources.map((resource) => (
                <Paper key={resource.label} sx={customStyles.resourceRow.paper}>
                    <Typography variant="subtitle2" color="secondary" sx={customStyles.resourceRow.label}>
                        {resource.label}
                    </Typography>
                    <TextField
                        type="number"
                        value={resource.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => resource.onChange(e.target.value)}
                        size="small"
                        sx={customStyles.resourceInput}
                    />
                </Paper>
            ))}

            {/* Armor Tier — +/- buttons or dash */}
            <Paper sx={customStyles.resourceRow.paper}>
                <Typography variant="subtitle2" color="secondary" sx={customStyles.resourceRow.label}>
                    {t('stats.armorTier')}
                </Typography>
                {hasArmor ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => handleTierChange(-1)}
                            disabled={currentTier <= 0}
                            color="primary"
                            sx={{ p: 0.25 }}
                        >
                            <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography
                            variant="h6"
                            color="primary"
                            sx={{
                                minWidth: '2ch',
                                textAlign: 'center',
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: '1.3rem',
                            }}
                        >
                            {currentTier}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => handleTierChange(1)}
                            disabled={currentTier >= maxTier}
                            color="primary"
                            sx={{ p: 0.25 }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    <TextField
                        type="text"
                        value="−"
                        size="small"
                        slotProps={{input: {readOnly: true}}}
                        sx={customStyles.resourceInput}
                    />
                )}
            </Paper>
        </Box>
    );
}
