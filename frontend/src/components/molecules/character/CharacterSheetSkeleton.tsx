import { Box, Skeleton, useMediaQuery } from '@mui/material';
import { morkBorgColors } from '@/theme/morkBorgTheme';

// On-theme shimmer: light blocks over the dark sheet so the skeleton reads as
// "the sheet is assembling" rather than a generic grey placeholder.
const blockSx = {
    bgcolor: 'rgba(245, 245, 245, 0.08)',
    borderRadius: 0,
} as const;

type BlockProps = {
    height: number | string;
    width?: number | string;
    animation: 'wave' | false;
    radius?: number;
};

function Block({ height, width = '100%', animation, radius = 0 }: BlockProps) {
    return (
        <Skeleton
            variant="rectangular"
            animation={animation}
            width={width}
            height={height}
            sx={{ ...blockSx, borderRadius: radius }}
        />
    );
}

/**
 * Loading placeholder for the character sheet. Mirrors the real sheet's section
 * rhythm and known heights so the layout doesn't jump when the character lands.
 * Shown on first run behind the storage notice (before any character is created)
 * and while a character is loading.
 */
export function CharacterSheetSkeleton() {
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const animation: 'wave' | false = prefersReducedMotion ? false : 'wave';

    return (
        <Box
            data-testid="character-sheet-skeleton"
            aria-busy="true"
            aria-live="polite"
            aria-label="Loading character sheet"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}
        >
            {/* Summary bar */}
            <Block height={64} animation={animation} />

            {/* Resource row: HP / Omens / silver style tiles */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
                <Block height={72} animation={animation} />
                <Block height={72} animation={animation} />
                <Block height={72} animation={animation} />
            </Box>

            {/* Equipped bar */}
            <Block height={48} animation={animation} />

            {/* Name + class */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Block height={40} width="60%" animation={animation} />
                <Block height={20} width="35%" animation={animation} />
            </Box>

            {/* Abilities: four stat blocks */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
                <Block height={88} animation={animation} />
                <Block height={88} animation={animation} />
                <Block height={88} animation={animation} />
                <Block height={88} animation={animation} />
            </Box>

            {/* Descriptors */}
            <Block height={120} animation={animation} />

            {/* Divider rhythm */}
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                <Block height={16} width={24} animation={animation} />
            </Box>

            {/* Modifiers panel */}
            <Block height={96} animation={animation} />

            {/* On-hand / inventory rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Block height={44} animation={animation} />
                <Block height={44} animation={animation} />
                <Block height={44} animation={animation} />
            </Box>

            {/* Notes */}
            <Block height={120} animation={animation} />

            {/* Footer action */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                <Block height={48} width={220} animation={animation} radius={0} />
            </Box>

            {/* Hairline accent so the skeleton still reads as MÖRK BORG, not blank */}
            <Box sx={{ height: 4, bgcolor: `${morkBorgColors.pink}33` }} />
        </Box>
    );
}
