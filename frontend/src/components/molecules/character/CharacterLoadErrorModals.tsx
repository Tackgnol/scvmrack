import { ModalButton, MorkBorgModal } from '@/components';
import {
  getUserFacingApiErrorMessage,
  isApiUnauthorized,
} from '@/utils/errorUtils';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

// The three load-failure states are mutually exclusive, so they collapse into one
// parameterized modal driven by `issue` (null = nothing wrong, render nothing).
export type CharacterLoadIssue = 'not-found' | 'access-denied' | 'load-error';

type CharacterLoadErrorModalsProps = {
  issue: CharacterLoadIssue | null;
  error: unknown;
  onGenerateNew: () => void;
};

export function CharacterLoadErrorModals({
  issue,
  error,
  onGenerateNew,
}: CharacterLoadErrorModalsProps) {
  const { t } = useTranslation();

  if (!issue) return null;

  const title =
    issue === 'not-found'
      ? t('characters.notFound')
      : issue === 'access-denied'
        ? t('characters.accessDenied', "You don't have access to this scvm")
        : isApiUnauthorized(error)
          ? t('errors.unauthorizedTitle', 'Session expired')
          : t('characters.loadError', 'Failed to load character');

  const body =
    issue === 'not-found'
      ? t('characters.notFoundDescription')
      : issue === 'access-denied'
        ? t(
            'characters.accessDeniedDescription',
            'This scvm belongs to another session or account. Generate a new one or open one of yours.'
          )
        : getUserFacingApiErrorMessage(error, t, 'Failed to load character');

  return (
    <MorkBorgModal
      open
      onClose={onGenerateNew}
      title={title}
      closeOnBackdrop={false}
      showCloseButton={false}
      actions={
        <ModalButton variant="primary" onClick={onGenerateNew}>
          {t('characters.generateNew')}
        </ModalButton>
      }
    >
      <Typography>{body}</Typography>
    </MorkBorgModal>
  );
}
