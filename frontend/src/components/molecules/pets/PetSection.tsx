import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { customStyles } from '../../../theme/morkBorgTheme';
import { usePetSection } from '@/hooks/usePetSection';
import { formatActionDie } from '@components/pets/formatActionDie';
import UseSectionLabel from '@components/molecules/uses/UseSectionLabel';
import TrackedUseRow from '@components/molecules/uses/TrackedUseRow';

interface PetSectionProps {
  showLabel?: boolean;
}

export default function PetSection({ showLabel = true }: PetSectionProps) {
  const { t } = useTranslation();
  const { petsWithIndices, hasPendingPipSave, isPipPending, markPipPending } =
    usePetSection();

  if (petsWithIndices.length === 0) {
    return null;
  }

  return (
    <Box sx={customStyles.powersSection.container}>
      {showLabel && (
        <UseSectionLabel title={t('pets.title')} hasPendingSave={hasPendingPipSave} />
      )}

      <Box sx={customStyles.powersSection.contentContainer}>
        {petsWithIndices.map(({ item, equipmentIndex, uses }, displayIndex) => (
          <TrackedUseRow
            key={item.key ?? equipmentIndex}
            number={displayIndex + 1}
            name={item.name ?? t('pets.unknown')}
            description={item.description}
            supplementalText={`${t('pets.actionDie')}: ${formatActionDie(item.dice)}`}
            uses={uses}
            isUsePending={(useIndex) => isPipPending(equipmentIndex, useIndex)}
            createPipLabel={(useIndex, used) =>
              t(
                'pets.hpPip',
                `${used ? 'Mark hit point empty' : 'Mark hit point filled'}: ${item.name ?? t('pets.unknown')} point ${useIndex + 1}`,
              )
            }
            onToggleUse={(useIndex) => markPipPending(equipmentIndex, useIndex)}
          />
        ))}
      </Box>
    </Box>
  );
}
