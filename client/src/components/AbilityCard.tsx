import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { morkBorgColors } from '../theme/morkBorgTheme';

type AbilityName = 'agility' | 'presence' | 'strength' | 'toughness';

interface AbilityCardProps {
    ability: AbilityName;
    rotate?: number;
}

interface AbilityInfo {
    label: string;
    desc: string;
}

const abilityInfo: Record<AbilityName, AbilityInfo> = {
    agility: { label: 'Agility', desc: 'Defense, Initiative' },
    presence: { label: 'Presence', desc: 'Attacks, Powers' },
    strength: { label: 'Strength', desc: 'Melee, Carry' },
    toughness: { label: 'Toughness', desc: 'HP, Endurance' },
};

// Convert raw stat (3-18) to modifier (-3 to +3)
function statToModifier(stat: number): number {
    if (stat <= 4) return -3;
    if (stat <= 6) return -2;
    if (stat <= 8) return -1;
    if (stat <= 12) return 0;
    if (stat <= 14) return 1;
    if (stat <= 16) return 2;
    return 3;
}

export default function AbilityCard({ability, rotate = 0}: AbilityCardProps) {
    const {character, updateField} = useCharacter();

    // Abilities are top-level fields in the API
    const value = character?.[ability] ?? 10;
    const info = abilityInfo[ability];
    const modifier = statToModifier(value);
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

    const adjustAbility = (delta: number) => {
        const newValue = Math.max(1, Math.min(20, value + delta));
        updateField(ability, newValue);
    };

    const setAbility = (newValue: number) => {
        const clamped = Math.max(1, Math.min(20, newValue));
        updateField(ability, clamped);
    };

    return (
        <Paper
            sx={{
                p: 2,
                textAlign: 'center',
                transform: `rotate(${rotate}deg)`,
            }}
        >
            <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
                {info.label}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                <IconButton
                    onClick={() => adjustAbility(-1)}
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: morkBorgColors.grey,
                        border: `2px solid ${morkBorgColors.yellow}`,
                        color: morkBorgColors.yellow,
                        '&:hover': {
                            bgcolor: morkBorgColors.yellow,
                            color: morkBorgColors.black,
                        },
                    }}
                >
                    <RemoveIcon fontSize="small" />
                </IconButton>

                <TextField
                    type="number"
                    value={value}
                    onChange={(e) => setAbility(parseInt(e.target.value) || 10)}
                    sx={{
                        width: 50,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: morkBorgColors.yellow,
                            '& input': {
                                color: morkBorgColors.black,
                                textAlign: 'center',
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: '2rem',
                                p: 0.5,
                            },
                            '& fieldset': { border: 'none' },
                        },
                    }}
                    size="small"
                />

                <IconButton
                    onClick={() => adjustAbility(1)}
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: morkBorgColors.grey,
                        border: `2px solid ${morkBorgColors.yellow}`,
                        color: morkBorgColors.yellow,
                        '&:hover': {
                            bgcolor: morkBorgColors.yellow,
                            color: morkBorgColors.black,
                        },
                    }}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            <Typography variant="h4" sx={{ mt: 1, color: morkBorgColors.white }}>
                {modifierStr}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    mt: 0.5,
                    opacity: 0.6,
                    fontStyle: 'italic',
                    fontSize: '0.6rem',
                }}
            >
                {info.desc}
            </Typography>
        </Paper>
    );
}
