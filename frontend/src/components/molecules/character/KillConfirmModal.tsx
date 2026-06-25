import { ModalButton, MorkBorgModal } from '@/components';
import { Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type KillConfirmModalProps = {
  open: boolean;
  characterName: string;
  partyMember?: boolean;
  dontAskAgain: boolean;
  onDontAskAgainChange: (value: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function KillConfirmModal({
  open,
  characterName,
  partyMember = false,
  dontAskAgain,
  onDontAskAgainChange,
  onCancel,
  onConfirm,
}: KillConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <MorkBorgModal
      open={open}
      onClose={onCancel}
      title={t('actions.killConfirmTitle', 'KILL THIS SCVM?')}
      maxWidth="xs"
      actions={
        <>
          <ModalButton variant="secondary" onClick={onCancel}>
            {t('actions.cancel')}
          </ModalButton>
          <ModalButton
            variant="danger"
            onClick={onConfirm}
            data-testid="kill-confirm-button"
          >
            {t('actions.killConfirm', 'Kill & Replace')}
          </ModalButton>
        </>
      }
    >
      <Typography>
        {t(
          'actions.killConfirmDesc',
          '"{{name}}" will be permanently deleted and a new scvm will crawl out.',
          { name: characterName }
        )}
      </Typography>
      {partyMember && (
        <Typography sx={{ mt: 1 }}>
          {t(
            'actions.killConfirmPartyDesc',
            'The replacement will crawl back into this party before the old body is removed.'
          )}
        </Typography>
      )}
      <FormControlLabel
        sx={{ mt: 1 }}
        control={
          <Checkbox
            checked={dontAskAgain}
            onChange={(event) => onDontAskAgainChange(event.target.checked)}
            data-testid="kill-confirm-dont-ask"
          />
        }
        label={t('actions.killConfirmDontAskAgain', "Don't show this again")}
      />
    </MorkBorgModal>
  );
}
