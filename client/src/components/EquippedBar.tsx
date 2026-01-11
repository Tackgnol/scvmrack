
import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, Paper, Typography } from '@mui/material';
import { morkBorgColors } from '../theme/morkBorgTheme';

interface EquippedQuickProps {
    icon: string;
    type: string;
    name: string;
    detail?: string;
}

function EquippedQuick({ icon, type, name, detail }: EquippedQuickProps) {
    return (
        <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.5rem' }}>{icon}</Typography>
            <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="secondary" sx={{ fontSize: '0.55rem' }}>
                    {type}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{ color: morkBorgColors.white, fontSize: '1.1rem', mt: 0.25 }}
                >
                    {name || 'None'}
                </Typography>
                {detail && (
                    <Typography
                        variant="subtitle2"
                        sx={{ color: morkBorgColors.yellow, fontSize: '0.7rem' }}
                    >
                        {detail}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

// Format dice array like [6] -> "d6" or [6, 6] -> "2d6"
function formatDice(dice?: number[]): string {
    if (!dice || dice.length === 0) return '';
    // Group same dice together
    const counts: Record<number, number> = {};
    dice.forEach((d) => {
        counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([die, count]) => (count > 1 ? `${count}d${die}` : `d${die}`))
        .join(' + ');
}

export default function EquippedBar() {
    const { character } = useCharacter();

    // Get first equipped weapon (or undefined)
    const weapon = character?.equipped_weapons?.[0];
    const armor = character?.equipped_armor;

    const weaponName = weapon?.name ?? 'Unarmed';
    const weaponDamage = weapon?.dice ? formatDice(weapon.dice) : 'd2';

    const armorName = armor?.name ?? 'Unarmored';
    const armorProtection = armor?.dice ? `-${formatDice(armor.dice)}` : '−';

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.25,
                mb: 2.5,
            }}
        >
            <EquippedQuick
                icon="⚔"
                type="Weapon"
                name={weaponName}
                detail={weaponDamage}
            />
            <EquippedQuick
                icon="🛡"
                type="Armor"
                name={armorName}
                detail={armorProtection}
            />
        </Box>
    );
}
