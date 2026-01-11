import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, Paper, TextField, Typography } from '@mui/material';
import { morkBorgColors } from '../theme/morkBorgTheme';
import type { ReactNode } from 'react';

interface SummaryStatProps {
    label: string;
    children: ReactNode;
}

const SummaryStat = ({ label, children }: SummaryStatProps) => (
    <Box
        sx={{
            p: 2,
            textAlign: 'center',
            borderRight: `1px solid ${morkBorgColors.grey}`,
            '&:last-child': { borderRight: 'none' },
        }}
    >
        <Typography variant="subtitle2" color="secondary" sx={{ mb: 0.5 }}>
            {label}
        </Typography>
        {children}
    </Box>
);

export default function SummaryBar() {
    const { character, updateField } = useCharacter();

    const currentHp = character?.current_hp ?? 0;
    const maxHp = character?.max_hp ?? 1;
    const omens = character?.omens ?? 0;
    const silver = character?.silver ?? 0;
    const armorTier = character?.equipped_armor?.max_tier ?? 0;

    // Defense values (will add calculation later)
    const toDodge = 12;
    const toHit = 12;

    return (
        <Paper
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(3, 1fr)',
                    sm: '2fr repeat(5, 1fr)'
                },
                mb: 2.5,
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    bgcolor: 'secondary.main',
                },
            }}
        >
            <SummaryStat label="Hit Points">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <TextField
                        type="number"
                        value={currentHp}
                        onChange={(e) => updateField('current_hp', parseInt(e.target.value) || 0)}
                        sx={{
                            width: 45,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'secondary.main',
                                '& input': {
                                    color: morkBorgColors.black,
                                    textAlign: 'center',
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '1.4rem',
                                    p: 0.5,
                                },
                            },
                        }}
                        size="small"
                    />
                    <Typography sx={{ color: morkBorgColors.white, fontFamily: "'Bebas Neue'" }}>
                        /
                    </Typography>
                    <Box
                        sx={{
                            width: 45,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${morkBorgColors.pink}`,
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                color: morkBorgColors.pink,
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: '1.2rem',
                            }}
                        >
                            {maxHp}
                        </Typography>
                    </Box>
                </Box>
            </SummaryStat>

            <SummaryStat label="To Dodge">
                <Typography variant="h3" color="primary">
                    {toDodge}
                </Typography>
            </SummaryStat>

            <SummaryStat label="To Hit">
                <Typography variant="h3" color="primary">
                    {toHit}
                </Typography>
            </SummaryStat>

            <SummaryStat label="Omens">
                <Typography variant="h3" color="primary">
                    {omens}
                </Typography>
            </SummaryStat>

            <SummaryStat label="Silver">
                <Typography variant="h3" color="primary">
                    {silver}
                </Typography>
            </SummaryStat>

            <SummaryStat label="Armor">
                <Typography variant="h3" color="primary">
                    {armorTier || '−'}
                </Typography>
            </SummaryStat>
        </Paper>
    );
}
