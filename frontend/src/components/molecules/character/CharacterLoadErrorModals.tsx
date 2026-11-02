import { ModalButton, MorkBorgModal } from '@/components';
import { getCharacterLoadErrorCopy } from './CharacterLoadErrorModals.utils';
import type { CharacterLoadErrorModalsProps } from './CharacterLoadErrorModals.models';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { appHistory } from '@/router/history';

// A single issue selects the recovery message; null means there is no load failure.
export function CharacterLoadErrorModals({
  issue,
  error,
  onGenerateNew,
  showRoster = false,
}: CharacterLoadErrorModalsProps) {
  const { t } = useTranslation();

  if (!issue) {
    return null;
  }

  const { title, body } = getCharacterLoadErrorCopy(issue, error, t);

  return (
    <MorkBorgModal
      open
      onClose={onGenerateNew}
      title={title}
      closeOnBackdrop={false}
      showCloseButton={false}
      actions={
        <>
          <ModalButton
            variant="primary"
            onClick={() =>
              void appHistory.push(showRoster ? '/characters' : '/')
            }
          >
            {showRoster
              ? t('characters.backToRoster', 'Back to my Scvms')
              : t('characters.backToStart', 'Back to Start')}
          </ModalButton>
          <ModalButton variant="primary" onClick={onGenerateNew}>
            {t('characters.generateNew')}
          </ModalButton>
        </>
      }
    >
      <Typography>{body}</Typography>
    </MorkBorgModal>
  );
}
