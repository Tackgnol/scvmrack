import { Box } from '@mui/material';
import type { SectionProps } from '@/components/molecules/character-create/DraftSection';
import { DraftNameSection } from '@/components/molecules/character-create/DraftNameSection';
import { DraftStatsSection } from '@/components/molecules/character-create/DraftStatsSection';
import { DraftAbilitiesSection } from '@/components/molecules/character-create/DraftAbilitiesSection';
import { DraftGearSection } from '@/components/molecules/character-create/DraftGearSection';
import { DraftVitalsSection } from '@/components/molecules/character-create/DraftVitalsSection';
import { DraftFlavorSection } from '@/components/molecules/character-create/DraftFlavorSection';

export function CreateSheetDesktop(props: SectionProps) {
  return (
    <Box
      sx={{
        // Two columns for the light sections; the dense Stats card spans the
        // full width so its rows can lay out 2-up instead of stacking tall.
        // Dense auto-flow backfills the cell beside Name so nothing is wasted.
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridAutoFlow: 'dense',
        columnGap: 2,
        py: 2,
      }}
      data-testid="create-sheet-desktop"
    >
      <DraftNameSection {...props} />
      <Box sx={{ gridColumn: '1 / -1' }}>
        <DraftStatsSection {...props} />
      </Box>
      <DraftVitalsSection {...props} />
      <DraftAbilitiesSection {...props} />
      <DraftGearSection {...props} />
      <DraftFlavorSection {...props} />
    </Box>
  );
}
