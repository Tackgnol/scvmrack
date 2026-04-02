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
        currentDr={summaryMetrics.toDodge}
        breakdown={summaryMetrics.dodgeBreakdown}
        unknownOriginLabel={unknownOriginLabel}
        modifiersLabel={t('modifiers.title')}
        noModifiersLabel={t('modifiers.noModifiers')}
        statLabel={t('attributes.agility')}
      />
    );
  }

  if (activeDetail === 'melee') {
    return (
      <SummaryCombatBreakdown
        title={t('stats.toHitMelee')}
        abilityModifier={summaryMetrics.strengthModifier}
        currentDr={summaryMetrics.toHitMelee}
        breakdown={summaryMetrics.meleeBreakdown}
        unknownOriginLabel={unknownOriginLabel}
        modifiersLabel={t('modifiers.title')}
        noModifiersLabel={t('modifiers.noModifiers')}
        statLabel={t('attributes.strength')}
      />
    );
  }

  if (activeDetail === 'ranged') {
    return (
      <SummaryCombatBreakdown
        title={t('stats.toHitRanged')}
        abilityModifier={summaryMetrics.presenceModifier}
        currentDr={summaryMetrics.toHitRanged}
        breakdown={summaryMetrics.rangedBreakdown}
        unknownOriginLabel={unknownOriginLabel}
        modifiersLabel={t('modifiers.title')}
        noModifiersLabel={t('modifiers.noModifiers')}
        statLabel={t('attributes.presence')}
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
        emptyLabel={t('equipment.none')}
        unknownItemLabel={t('character.unknown')}
      />
    );
  }

  return null;
}
