import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import { Chip } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';

export function HeaderStatusChip({ saving }: { saving: boolean }) {
  const { t } = useTranslation();

  if (saving) {
    return (
      <Chip
        data-testid="saving-chip"
        size="small"
        icon={<SyncIcon sx={customStyles.header.syncIcon} />}
        label={t('status.saving')}
        variant="outlined"
        sx={customStyles.header.savingChip}
      />
    );
  }

  return (
    <Chip
      data-testid="synced-chip"
      size="small"
      icon={<CloudDoneIcon />}
      label={t('status.synced')}
      color="success"
      variant="outlined"
      sx={customStyles.statusChip.common}
    />
  );
}
