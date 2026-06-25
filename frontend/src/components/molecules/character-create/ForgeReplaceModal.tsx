import { ModalButton, MorkBorgModal } from '@/components';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type ForgeReplaceModalProps = {
  open: boolean;
  scvmName: string;
  replacing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Guest-only heads-up before forging: a new scvm replaces the one this
 * anonymous session already owns (the backend prunes it on create). Mirrors
 * KillConfirmModal, minus the "don't ask again" — forging from scratch is
 * deliberate enough to confirm every time.
 */
export function ForgeReplaceModal({
  open,
  scvmName,
  replacing,
  onCancel,
  onConfirm,
}: ForgeReplaceModalProps) {
  const { t } = useTranslation();

  return (
    <MorkBorgModal
      open={open}
      onClose={onCancel}
      title={t('create.replaceConfirmTitle', 'Replace your scvm?')}
      maxWidth="xs"
      actions={
        <>
          <ModalButton variant="secondary" onClick={onCancel} disabled={replacing}>
            {t('actions.cancel', 'Cancel')}
          </ModalButton>
          <ModalButton
            variant="danger"
            onClick={onConfirm}
            disabled={replacing}
            data-testid="forge-replace-confirm"
          >
            {replacing
              ? t('create.confirming', 'Creating...')
              : t('create.replaceConfirmButton', 'Forge & Replace')}
          </ModalButton>
        </>
      }
    >
      <Typography>
        {t(
          'create.replaceConfirmDesc',
          '"{{name}}" will be permanently deleted and this new wretch takes its place.',
          { name: scvmName }
        )}
      </Typography>
    </MorkBorgModal>
  );
}
