import { useCharacter } from '@/CharacterContext/CharacterContext.tsx';
import { Paper, Typography } from '@mui/material';
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

export default function SummaryBar() {
  const { character } = useCharacter();
  const { t } = useTranslation();

  const summaryMetrics = useSummaryMetrics(character);
  const summaryDetailState = useSummaryDetailState();
  const unknownOriginLabel = t('modifiers.computed.unknownOrigin');

  return (
    <Paper sx={customStyles.summaryBarPaper}>
      <SummaryStatButton
        label={t('stats.toDodge')}
        isActive={summaryDetailState.activeDetail === 'dodge'}
        onHoverOpen={(element) => summaryDetailState.openHoverDetail('dodge', element)}
        onHoverClose={summaryDetailState.scheduleClose}
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
        onHoverOpen={(element) => summaryDetailState.openHoverDetail('melee', element)}
        onHoverClose={summaryDetailState.scheduleClose}
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
        onHoverOpen={(element) => summaryDetailState.openHoverDetail('ranged', element)}
        onHoverClose={summaryDetailState.scheduleClose}
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
        onHoverOpen={(element) => summaryDetailState.openHoverDetail('encumbrance', element)}
        onHoverClose={summaryDetailState.scheduleClose}
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
        onClickAway={summaryDetailState.closeNow}
        onMouseEnter={summaryDetailState.clearCloseTimer}
        onMouseLeave={summaryDetailState.scheduleClose}
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
