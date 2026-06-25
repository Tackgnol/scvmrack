import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { summaryBarStyles as styles } from '@/theme/createStyles';

type CreateSummaryBarProps = {
  className: string | null;
  onConfirm: () => void;
  onRestart: () => void;
  confirming: boolean;
  busy: boolean;
  confirmDisabled?: boolean;
  statusMessage?: string | null;
};

export function CreateSummaryBar({
  className,
  onConfirm,
  onRestart,
  confirming,
  busy,
  confirmDisabled = false,
  statusMessage = null,
}: CreateSummaryBarProps) {
  const { t } = useTranslation();
  return (
    <Box sx={styles.root}>
      <Box sx={styles.meta}>
        <Typography component="span" sx={styles.classChip}>
          {className ?? t('create.classlessLabel', 'Classless')}
        </Typography>
        <Button
          data-testid="create-restart-button"
          onClick={onRestart}
          disabled={busy}
          size="small"
          sx={styles.restart}
        >
          {t('create.changeClass', 'Change class')}
        </Button>
        {statusMessage && (
          <Typography component="span" sx={styles.status}>
            {statusMessage}
          </Typography>
        )}
      </Box>
      <Button
        data-testid="create-confirm-button"
        variant="contained"
        onClick={onConfirm}
        disabled={busy || confirming || confirmDisabled}
        sx={styles.confirm}
      >
        {confirming
          ? t('create.confirming', 'Creating...')
          : t('create.confirm', 'Create this wretch')}
      </Button>
    </Box>
  );
}
