import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import { Box, Paper, Typography } from '@mui/material';
import { CharacterResponse } from "@/hooks/models.ts";
import { customStyles } from '../theme/morkBorgTheme';
import type { ReactNode } from 'react';
import {useTranslation} from 'react-i18next';
import AnimatedNumber from './AnimatedNumber';

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

    // Use DR values from backend (calculated with all modifiers)
    // Cast to any since the schema might not have these fields yet
    const char = character as CharacterResponse | undefined;
    const encumbrance = char?.encumbrance ?? character?.equipment?.length ?? 0;
    const maxEncumbrance = char?.maxEncumbrance ?? 8;
    const toDodge = char?.drToDodge ?? 12 - (character?.agility ?? 10);
    const toHitMelee = char?.drToMelee ?? 12 - (character?.strength ?? 10);
    const toHitRanged = char?.drToRanged ?? 12 - (character?.presence ?? 10);
    const characterKey = character?.id ?? 'unknown';

    return (
        <Paper sx={customStyles.summaryBarPaper}>
            <SummaryStat label={t('stats.toDodge')}>
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={toDodge} cacheKey={`${characterKey}:summary:dodge`} durationMs={340} />
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.toHitMelee')}>
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={toHitMelee} cacheKey={`${characterKey}:summary:melee`} durationMs={340} />
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.toHitRanged')}>
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={toHitRanged} cacheKey={`${characterKey}:summary:ranged`} durationMs={340} />
                </Typography>
            </SummaryStat>

            <SummaryStat label={t('stats.encumbrance')}>
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={encumbrance} cacheKey={`${characterKey}:summary:encumbrance`} durationMs={320} />
                    {' / '}
                    <AnimatedNumber value={maxEncumbrance} cacheKey={`${characterKey}:summary:max-encumbrance`} durationMs={320} />
                </Typography>
            </SummaryStat>
        </Paper>
    );
}
