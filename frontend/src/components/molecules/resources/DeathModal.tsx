import { Box, Button, Typography } from '@mui/material';
import { morkBorgColors } from '@theme/morkBorgTheme.ts';
import { useTranslation } from 'react-i18next';
import MorkBorgModal from '../modal/MorkBorgModal';

type DeathModalProps = {
  open: boolean;
  onClose: () => void;
  onKill: () => void;
};

export default function DeathModal({ open, onClose, onKill }: DeathModalProps) {
  const { t } = useTranslation();

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={t('deathModal.title', "It's not ever...yet")}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} variant="contained">
            {t('deathModal.close', 'Close')}
          </Button>
          <Button
            onClick={onKill}
            variant="contained"
            data-testid="death-modal-kill-button"
            sx={{
              backgroundColor: '#8b0000',
              color: morkBorgColors.yellow,
              '&:hover': {
                backgroundColor: morkBorgColors.pink,
                color: morkBorgColors.black,
              },
            }}
          >
            {t('deathModal.kill', 'Kill & Replace')}
          </Button>
        </>
      }
    >
      <Typography sx={{ color: morkBorgColors.pink, mb: 1.25, textAlign: 'left' }}>
        {t('deathModal.rollPrompt', 'Roll a d4')}
      </Typography>

      <Box sx={{ display: 'grid', gap: 0.85, mb: 2.25 }}>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('deathModal.rules.one', '1 Fall unconscious for d4 rounds; then awaken with d4 HP.')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('deathModal.rules.two', "2 Roll a d6: 1-5 = Broken or severed limb. 6 = Lost eye. Can't act for d4 rounds; then become active with d4 HP.")}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('deathModal.rules.three', '3 Haemorrhage: death in two hours unless treated. All tests are DR16 the first hour; then DR18 the last hour.')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('deathModal.rules.four', '4 Dead. Lose one HP.')}
        </Typography>
      </Box>
    </MorkBorgModal>
  );
}
