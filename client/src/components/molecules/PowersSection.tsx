import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '../../theme/morkBorgTheme';
import { usePowersSection } from '@/hooks/usePowersSection';
import UseSectionLabel from '@components/molecules/uses/UseSectionLabel';
import TrackedUseRow from '@components/molecules/uses/TrackedUseRow';

interface PowersSectionProps {
  showLabel?: boolean;
}

export default function PowersSection({ showLabel = true }: PowersSectionProps) {
  const { t } = useTranslation();
  const {
    scrollsWithIndices,
    hasPendingPipSave,
    isPipPending,
    markPipPending,
  } = usePowersSection();

  if (scrollsWithIndices.length === 0) {
    return null;
  }

  return (
    <Box sx={customStyles.powersSection.container}>
      {showLabel && (
        <UseSectionLabel
          title={t('powers.title')}
          hasPendingSave={hasPendingPipSave}
        />
      )}

      <Box sx={customStyles.powersSection.contentContainer}>
        {scrollsWithIndices.map(({ item, equipmentIndex, uses }, displayIndex) => (
          <TrackedUseRow
            key={item.key ?? equipmentIndex}
            number={displayIndex + 1}
            name={item.name ?? t('powers.unknownScroll')}
            description={item.description}
            uses={uses}
            isUsePending={(useIndex) => isPipPending(equipmentIndex, useIndex)}
            createPipLabel={(useIndex, used) =>
              t(
                'powers.usePip',
                `${used ? 'Mark unused' : 'Mark used'}: ${item.name ?? t('powers.unknownScroll')} use ${useIndex + 1}`,
              )
            }
            onToggleUse={(useIndex) => markPipPending(equipmentIndex, useIndex)}
            pipTestId="power-pip"
          />
        ))}
      </Box>
    </Box>
  );
}
