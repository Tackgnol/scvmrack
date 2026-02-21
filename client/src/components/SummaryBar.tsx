import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, Paper, Typography } from '@mui/material';
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
    const { character } = useCharacter();
    const {t} = useTranslation();

    const encumbrance = character?.equipment?.length ?? 0;

    // Use DR values from backend (calculated with all modifiers)
    // Cast to any since the schema might not have these fields yet
    const char = character as any;
    const toDodge = char?.dr_to_dodge ?? 12 - (character?.agility ?? 10);
    const toHitMelee = char?.dr_to_melee ?? 12 - (character?.strength ?? 10);
    const toHitRanged = char?.dr_to_ranged ?? 12 - (character?.presence ?? 10);

    return (
        <Paper sx={customStyles.summaryBarPaper}>
            <SummaryStat label={t('stats.toDodge')}>
                <Typography variant="h3" color="primary">
                    {toDodge}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.toHitMelee')}>
                <Typography variant="h3" color="primary">
                    {toHitMelee}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.toHitRanged')}>
                <Typography variant="h3" color="primary">
                    {toHitRanged}
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.encumbrance')}>
                <Typography variant="h3" color="primary">
                    {encumbrance} / 8
                </Typography>
            </SummaryStat>
        </Paper>
    );
}
