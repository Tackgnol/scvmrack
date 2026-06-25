import { type CharacterListItem } from '@/hooks/models.ts';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import MorkBorgModal, { ModalButton } from '@components/molecules/modal/MorkBorgModal';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type DeleteCharacterModalProps = {
  open: boolean;
  character: CharacterListItem | null;
  isActive: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const modalStyles = {
  body: {
    display: 'grid',
    gap: 2,
  },
  warning: {
    bgcolor: morkBorgColors.blood,
    color: morkBorgColors.yellow,
    border: `2px solid ${morkBorgColors.yellow}`,
    px: 1.5,
    py: 1,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    lineHeight: 1.4,
    textTransform: 'uppercase' as const,
  },
  summary: {
    bgcolor: morkBorgColors.grey,
    border: `2px solid ${morkBorgColors.pink}`,
    p: 1.5,
  },
  name: {
    color: morkBorgColors.yellow,
    fontFamily: '"MedievalSharp", serif',
    fontSize: '1.45rem',
    lineHeight: 1.1,
    overflowWrap: 'anywhere' as const,
  },
  meta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 1,
    mt: 1.25,
  },
  metaLabel: {
    color: morkBorgColors.pink,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  },
  metaValue: {
    color: morkBorgColors.white,
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: '0.95rem',
    lineHeight: 1.25,
    mt: 0.5,
    overflowWrap: 'anywhere' as const,
  },
  description: {
    color: morkBorgColors.white,
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: '1rem',
    lineHeight: 1.5,
    textWrap: 'pretty' as const,
  },
  activeNotice: {
    color: morkBorgColors.black,
    bgcolor: morkBorgColors.yellow,
    border: `2px solid ${morkBorgColors.black}`,
    px: 1.5,
    py: 1,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    lineHeight: 1.45,
    textTransform: 'uppercase' as const,
  },
};

export function DeleteCharacterModal({
  open,
  character,
  isActive,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteCharacterModalProps) {
  const { t } = useTranslation();
  const characterName =
    (character?.name || '').trim() || t('characters.unnamed', 'Unnamed Scvm');
  const className =
    (character?.className || '').trim() || t('characters.unknownClass', 'Unknown');
  const hpLabel =
    character?.currentHp != null || character?.maxHp != null
      ? `${character.currentHp ?? '-'}/${character.maxHp ?? '-'}`
      : '-';

  return (
    <MorkBorgModal
      open={open}
      onClose={onCancel}
      title={t('characters.deleteModalTitle', 'DELETE THIS SCVM?')}
      maxWidth="xs"
      closeOnBackdrop={!isDeleting}
      showCloseButton={!isDeleting}
      actions={
        <>
          <ModalButton
            variant="secondary"
            onClick={onCancel}
            disabled={isDeleting}
            data-testid="cancel-delete-character"
          >
            {t('actions.cancel', 'Cancel')}
          </ModalButton>
          <ModalButton
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting || !character?.id}
            data-testid="confirm-delete-character"
          >
            {isDeleting
              ? t('characters.deleting', 'Deleting...')
              : t('characters.deleteConfirmAction', 'Delete character')}
          </ModalButton>
        </>
      }
    >
      <Box sx={modalStyles.body} data-testid="delete-character-modal">
        <Typography sx={modalStyles.warning}>
          {t(
            'characters.deleteModalWarning',
            'Permanent deletion. This cannot be undone.'
          )}
        </Typography>

        <Box sx={modalStyles.summary}>
          <Typography sx={modalStyles.name}>{characterName}</Typography>
          <Box sx={modalStyles.meta}>
            <Box>
              <Typography sx={modalStyles.metaLabel}>
                {t('characters.columns.class', 'Class')}
              </Typography>
              <Typography sx={modalStyles.metaValue}>{className}</Typography>
            </Box>
            <Box>
              <Typography sx={modalStyles.metaLabel}>
                {t('characters.columns.hp', 'HP')}
              </Typography>
              <Typography sx={modalStyles.metaValue}>{hpLabel}</Typography>
            </Box>
          </Box>
        </Box>

        <Typography sx={modalStyles.description}>
          {t(
            'characters.deleteModalDescription',
            'The saved sheet, notes, equipment, and ownership record for "{{name}}" will be removed from your rack.',
            { name: characterName }
          )}
        </Typography>

        {isActive && (
          <Typography sx={modalStyles.activeNotice}>
            {t(
              'characters.deleteModalActiveNotice',
              'This is the active sheet. After deletion, no character will be selected.'
            )}
          </Typography>
        )}
      </Box>
    </MorkBorgModal>
  );
}
