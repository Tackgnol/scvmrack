import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, Paper, TextField, Typography } from '@mui/material';
import { customStyles } from '../theme/morkBorgTheme';
import type { ReactNode } from 'react';
import {useTranslation} from 'react-i18next';

interface SummaryStatProps {
    label: string;
    children: ReactNode;
}

const SummaryStat = ({ label, children }: SummaryStatProps) => (
    <Box sx={customStyles.summaryStat}>
        <Typography variant="subtitle2" color="secondary" sx={customStyles.summaryStatLabel}>
            {label}
        </Typography>
        {children}
    </Box>
);

export default function SummaryBar() {
    const { character, updateField } = useCharacter();
    const {t} = useTranslation();

    const currentHp = character?.current_hp ?? 0;
    const maxHp = character?.max_hp ?? 1;
    const omens = character?.omens ?? 0;
    const silver = character?.silver ?? 0;
    const armorTier = character?.equipped_armor?.max_tier ?? 0;

    // Defense values (will add calculation later)
    const toDodge = 12;
    const toHit = 12;

    return (
        <Paper sx={customStyles.summaryBarPaper}>
            <SummaryStat label={t('stats.hitPoints')}>
                <Box sx={customStyles.hpContainer}>
                    <TextField
                        type="number"
                        value={currentHp}
                        onChange={(e) => updateField('current_hp', parseInt(e.target.value) || 0)}
                        sx={customStyles.hpInput}
                        size="small"
                    />
                    <Typography sx={customStyles.hpDivider}>
                        /
                    </Typography>
                    <Box sx={customStyles.maxHpBox}>
                        <Typography sx={customStyles.maxHpText}>
                            {maxHp}
                        </Typography>
                    </Box>
                </Box>
            </SummaryStat>

            <SummaryStat label={t('stats.toDodge')}>
                <Typography variant="h3" color="primary">
                    {toDodge}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.toHit')}>
                <Typography variant="h3" color="primary">
                    {toHit}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.omens')}>
                <Typography variant="h3" color="primary">
                    {omens}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.silver')}>
                <Typography variant="h3" color="primary">
                    {silver}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.armor')}>
                <Typography variant="h3" color="primary">
                    {armorTier || '−'}
                </Typography>
            </SummaryStat>
        </Paper>
    );
}
