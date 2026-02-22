import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { customStyles } from '../theme/morkBorgTheme';
import {useTranslation} from 'react-i18next';
import {statToModifier} from "@/utils/stats.ts";
import AnimatedNumber from './AnimatedNumber';

type AbilityName = 'agility' | 'presence' | 'strength' | 'toughness';

interface AbilityCardProps {
    ability: AbilityName;
    rotate?: number;
}

export default function AbilityCard({ability, rotate = 0}: AbilityCardProps) {
    const {character, updateField} = useCharacter();
    const {t} = useTranslation();

    // Abilities are top-level fields in the API
    const value = character?.[ability] ?? 10;

    // Get translated label and description
    const label = t(`attributes.${ability}`);
    const desc = t(`attributes.${ability}Desc`);

    const modifier = statToModifier(value);
    const characterKey = character?.id ?? 'unknown';

    const adjustAbility = (delta: number) => {
        const newValue = Math.max(1, Math.min(20, value + delta));
        updateField(ability, newValue);
    };

    const setAbility = (newValue: number) => {
        const clamped = Math.max(1, Math.min(20, newValue));
        updateField(ability, clamped);
    };

    return (
        <Paper sx={customStyles.abilityCardTwo.paper(rotate)}>
            <Typography variant="subtitle2" color="secondary" sx={customStyles.abilityCardTwo.label}>
                {label}
            </Typography>

            <Box sx={customStyles.abilityCardTwo.controls}>
                <IconButton
                    onClick={() => adjustAbility(-1)}
                    sx={customStyles.abilityAdjustButton}
                >
                    <RemoveIcon fontSize="small" />
                </IconButton>

                <TextField
                    type="number"
                    value={value}
                    onChange={(e) => setAbility(parseInt(e.target.value) || 10)}
                    sx={customStyles.abilityValueInput}
                    size="small"
                />

                <IconButton
                    onClick={() => adjustAbility(1)}
                    sx={customStyles.abilityAdjustButton}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            <Typography variant="h4" sx={customStyles.abilityCard.modifier}>
                <AnimatedNumber
                    value={modifier}
                    cacheKey={`${characterKey}:ability:${ability}:modifier`}
                    durationMs={260}
                    format={(next) => {
                        const rounded = Math.round(next);
                        return rounded >= 0 ? `+${rounded}` : `${rounded}`;
                    }}
                />
            </Typography>

            <Typography variant="body2" sx={customStyles.abilityCardTwo.description}>
                {desc}
            </Typography>
        </Paper>
    );
}
