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

    // Defense values (will add calculation later)
    const toDodge = 12;
    const toHit = 12;
    const toCast = 12;

    return (
        <Paper sx={customStyles.summaryBarPaper}>
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

            <SummaryStat label={t('stats.toCast')}>
                <Typography variant="h3" color="primary">
                    {toCast}
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
