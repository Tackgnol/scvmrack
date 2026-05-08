import { useTranslation } from 'react-i18next';
import SummaryCombatBreakdown from './SummaryCombatBreakdown';
import SummaryEncumbranceBreakdown from './SummaryEncumbranceBreakdown';
import { type SummaryDetailKey, type SummaryMetrics } from '@/hooks/useSummaryMetrics';

interface SummaryDetailContentProps {
  activeDetail: SummaryDetailKey | null;
  summaryMetrics: SummaryMetrics;
  unknownOriginLabel: string;
}

export default function SummaryDetailContent({
  activeDetail,
  summaryMetrics,
  unknownOriginLabel,
}: SummaryDetailContentProps) {
  const { t } = useTranslation();

  if (activeDetail === 'dodge') {
    return (
      <SummaryCombatBreakdown
        title={t('stats.toDodge')}
        abilityModifier={summaryMetrics.agilityModifier}
        breakdown={summaryMetrics.dodgeBreakdown}
        unknownOriginLabel={unknownOriginLabel}
        modifiersLabel={t('modifiers.title')}
        noModifiersLabel={t('modifiers.noModifiers')}
        statLabel={t('attributes.agility')}
        formulaLabel={t('stats.drFormula', { stat: t('attributes.agility') })}
        rollHintLabel={t('stats.drRollHint')}
        baseDrLabel={t('stats.baseDr')}
        finalDrLabel={t('stats.finalDr', { dr: summaryMetrics.toDodge })}
      />
    );
  }

  if (activeDetail === 'melee') {
    return (
      <SummaryCombatBreakdown
        title={t('stats.toHitMelee')}
        abilityModifier={summaryMetrics.strengthModifier}
        breakdown={summaryMetrics.meleeBreakdown}
        unknownOriginLabel={unknownOriginLabel}
        modifiersLabel={t('modifiers.title')}
        noModifiersLabel={t('modifiers.noModifiers')}
        statLabel={t('attributes.strength')}
        formulaLabel={t('stats.drFormula', { stat: t('attributes.strength') })}
        rollHintLabel={t('stats.drRollHint')}
        baseDrLabel={t('stats.baseDr')}
        finalDrLabel={t('stats.finalDr', { dr: summaryMetrics.toHitMelee })}
      />
    );
  }

  if (activeDetail === 'ranged') {
    return (
      <SummaryCombatBreakdown
        title={t('stats.toHitRanged')}
        abilityModifier={summaryMetrics.presenceModifier}
        breakdown={summaryMetrics.rangedBreakdown}
        unknownOriginLabel={unknownOriginLabel}
        modifiersLabel={t('modifiers.title')}
        noModifiersLabel={t('modifiers.noModifiers')}
        statLabel={t('attributes.presence')}
        formulaLabel={t('stats.drFormula', { stat: t('attributes.presence') })}
        rollHintLabel={t('stats.drRollHint')}
        baseDrLabel={t('stats.baseDr')}
        finalDrLabel={t('stats.finalDr', { dr: summaryMetrics.toHitRanged })}
      />
    );
  }

  if (activeDetail === 'encumbrance') {
    return (
      <SummaryEncumbranceBreakdown
        title={t('stats.encumbrance')}
        encumbrance={summaryMetrics.encumbrance}
        maxEncumbrance={summaryMetrics.maxEncumbrance}
        items={summaryMetrics.encumbranceItems}
        groups={summaryMetrics.encumbranceGroups}
        emptyLabel={t('equipment.none')}
        unknownItemLabel={t('character.unknown')}
        resolveGroupLabel={(labelKey) => t(labelKey)}
      />
    );
  }

  return null;
}
