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

  const combatStats = [
    { detail: 'dodge', label: t('stats.toDodge'), value: summaryMetrics.toDodge, reacting: dodgeReacting },
    { detail: 'melee', label: t('stats.toHitMelee'), value: summaryMetrics.toHitMelee, reacting: meleeReacting },
    { detail: 'ranged', label: t('stats.toHitRanged'), value: summaryMetrics.toHitRanged, reacting: rangedReacting },
  ] as const;

  return (
    <Paper sx={customStyles.summaryBarPaper}>
      {combatStats.map((stat) => (
        <SummaryStatButton
          key={stat.detail}
          label={stat.label}
          isActive={summaryDetailState.activeDetail === stat.detail}
          reacting={stat.reacting}
          prefersReducedMotion={prefersReducedMotion}
          onPinToggle={(element) => summaryDetailState.togglePinnedDetail(stat.detail, element)}
        >
          <Typography variant="h3" color="primary">
            <AnimatedNumber
              value={stat.value}
              cacheKey={`${summaryMetrics.characterKey}:summary:${stat.detail}`}
              durationMs={340}
            />
          </Typography>
        </SummaryStatButton>
      ))}

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
