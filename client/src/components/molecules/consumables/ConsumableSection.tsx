import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '../../../theme/morkBorgTheme';
import { useConsumableSection } from '@/hooks/useConsumableSection';
import UseSectionLabel from '@components/molecules/uses/UseSectionLabel';
import TrackedUseRow from '@components/molecules/uses/TrackedUseRow';

interface ConsumableSectionProps {
  showLabel?: boolean;
}

export default function ConsumableSection({
  showLabel = true,
}: ConsumableSectionProps) {
  const { t } = useTranslation();
  const {
    consumablesWithIndices,
    hasPendingPipSave,
    isPipPending,
    markPipPending,
  } = useConsumableSection();

  if (consumablesWithIndices.length === 0) {
    return null;
  }

  return (
    <Box sx={customStyles.powersSection.container}>
      {showLabel && (
        <UseSectionLabel
          title={t('consumables.title')}
          hasPendingSave={hasPendingPipSave}
        />
      )}

      <Box sx={customStyles.powersSection.contentContainer}>
        {consumablesWithIndices.map(({ item, equipmentIndex, uses }, displayIndex) => (
          <TrackedUseRow
            key={item.key ?? equipmentIndex}
            number={displayIndex + 1}
            name={item.name ?? t('consumables.unknown')}
            description={item.description}
            uses={uses}
            isUsePending={(useIndex) => isPipPending(equipmentIndex, useIndex)}
            createPipLabel={(useIndex, used) =>
              t('consumables.usePip', {
                action: t(
                  used ? 'consumables.markUnused' : 'consumables.markUsed',
                ),
                name: item.name ?? t('consumables.unknown'),
                index: useIndex + 1,
                defaultValue: `${used ? 'Mark unused' : 'Mark used'}: ${item.name ?? t('consumables.unknown')} use ${useIndex + 1}`,
              })
            }
            onToggleUse={(useIndex) => markPipPending(equipmentIndex, useIndex)}
          />
        ))}
      </Box>
    </Box>
  );
}
