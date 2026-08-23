import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { Paper, Typography, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '@/theme/morkBorgTheme';
import {
  AnimatedNumber,
  SummaryStatButton,
  SummaryDetailPopper,
  SummaryDetailContent,
} from '@components/index';
import { useSummaryMetrics } from '@/hooks/useSummaryMetrics';
import { useSummaryDetailState } from '@/hooks/useSummaryDetailState';
import { useValuePulse } from '@/hooks/useValuePulse';

export default function SummaryBar() {
  const { character } = useCharacter();
  const { t } = useTranslation();

  const summaryMetrics = useSummaryMetrics(character);
  const summaryDetailState = useSummaryDetailState();
  const unknownOriginLabel = t('modifiers.computed.unknownOrigin');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const dodgeReacting = useValuePulse(summaryMetrics.toDodge, false, 280);
  const meleeReacting = useValuePulse(summaryMetrics.toHitMelee, false, 280);
  const rangedReacting = useValuePulse(summaryMetrics.toHitRanged, false, 280);
  const encumbranceReacting = useValuePulse(
    `${summaryMetrics.encumbrance}/${summaryMetrics.maxEncumbrance}`,
    false,
    280,
  );

  return (
    <Paper sx={customStyles.summaryBarPaper}>
      <SummaryStatButton
        label={t('stats.toDodge')}
        isActive={summaryDetailState.activeDetail === 'dodge'}
        reacting={dodgeReacting}
        prefersReducedMotion={prefersReducedMotion}
        onPinToggle={(element) => summaryDetailState.togglePinnedDetail('dodge', element)}
      >
        <Typography variant="h3" color="primary">
          <AnimatedNumber
            value={summaryMetrics.toDodge}
            cacheKey={`${summaryMetrics.characterKey}:summary:dodge`}
            durationMs={340}
          />
        </Typography>
      </SummaryStatButton>

      <SummaryStatButton
        label={t('stats.toHitMelee')}
        isActive={summaryDetailState.activeDetail === 'melee'}
        reacting={meleeReacting}
        prefersReducedMotion={prefersReducedMotion}
        onPinToggle={(element) => summaryDetailState.togglePinnedDetail('melee', element)}
      >
        <Typography variant="h3" color="primary">
          <AnimatedNumber
            value={summaryMetrics.toHitMelee}
            cacheKey={`${summaryMetrics.characterKey}:summary:melee`}
            durationMs={340}
          />
        </Typography>
      </SummaryStatButton>

      <SummaryStatButton
        label={t('stats.toHitRanged')}
        isActive={summaryDetailState.activeDetail === 'ranged'}
        reacting={rangedReacting}
        prefersReducedMotion={prefersReducedMotion}
        onPinToggle={(element) => summaryDetailState.togglePinnedDetail('ranged', element)}
      >
        <Typography variant="h3" color="primary">
          <AnimatedNumber
            value={summaryMetrics.toHitRanged}
            cacheKey={`${summaryMetrics.characterKey}:summary:ranged`}
            durationMs={340}
          />
        </Typography>
      </SummaryStatButton>

      <SummaryStatButton
        label={t('stats.encumbrance')}
        isActive={summaryDetailState.activeDetail === 'encumbrance'}
        reacting={encumbranceReacting}
        prefersReducedMotion={prefersReducedMotion}
        onPinToggle={(element) =>
          summaryDetailState.togglePinnedDetail('encumbrance', element)
        }
      >
        <Typography variant="h3" color="primary">
          <AnimatedNumber
            value={summaryMetrics.encumbrance}
            cacheKey={`${summaryMetrics.characterKey}:summary:encumbrance`}
            durationMs={320}
          />
          {' / '}
          <AnimatedNumber
            value={summaryMetrics.maxEncumbrance}
            cacheKey={`${summaryMetrics.characterKey}:summary:max-encumbrance`}
            durationMs={320}
          />
        </Typography>
      </SummaryStatButton>

      <SummaryDetailPopper
        open={summaryDetailState.popperOpen}
        anchorEl={summaryDetailState.anchorEl}
        accentColor={summaryDetailState.popperAccent}
        onClickAway={summaryDetailState.handleClickAway}
      >
        <SummaryDetailContent
          activeDetail={summaryDetailState.activeDetail}
          summaryMetrics={summaryMetrics}
          unknownOriginLabel={unknownOriginLabel}
        />
      </SummaryDetailPopper>
    </Paper>
  );
}
