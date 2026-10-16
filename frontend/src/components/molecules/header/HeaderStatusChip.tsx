import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import { Chip } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';
import type { HeaderStatusChipProps } from './HeaderStatusChip.models';

export function HeaderStatusChip({ saving, onRetrySave }: HeaderStatusChipProps) {
  const { t } = useTranslation();

  if (onRetrySave) {
    return (
      <Chip
        component="button"
        type="button"
        size="small"
        icon={<SyncIcon />}
        label={t('status.unsavedRetry')}
        color="error"
        variant="outlined"
        onClick={onRetrySave}
        sx={customStyles.statusChip.common}
      />
    );
  }

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
