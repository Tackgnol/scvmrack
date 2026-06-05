import { Box, Button, Typography } from '@mui/material';
import { morkBorgColors } from '@theme/morkBorgTheme.ts';
import { useTranslation } from 'react-i18next';
import AnimatedNumber from '../../atoms/AnimatedNumber';
import MorkBorgModal from '../modal/MorkBorgModal';

type OmensModalProps = {
  open: boolean;
  onClose: () => void;
  omens: number;
  cacheKey: string;
  onAddOmen: () => void;
  onUseOmen: () => void;
};

export default function OmensModal({
  open,
  onClose,
  omens,
  cacheKey,
  onAddOmen,
  onUseOmen,
}: OmensModalProps) {
  const { t } = useTranslation();

  return (
    <MorkBorgModal
      open={open}
      onClose={onClose}
      title={
        <>
          {t('omensModal.title', 'Omens')} (
          <AnimatedNumber value={omens} cacheKey={cacheKey} durationMs={260} />
          )
        </>
      }
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onAddOmen} variant="outlined">
            {t('omensModal.add', 'Add Omen')}
          </Button>
          <Button onClick={onUseOmen} variant="contained" disabled={omens <= 0}>
            {t('omensModal.use', 'Use Omen')}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'grid', gap: 0.75, mb: 2.25 }}>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('omensModal.rules.maxDamage', '† Deal maximum damage with an attack')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('omensModal.rules.reroll', "† Reroll a dice roll (yours or someone else's)")}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('omensModal.rules.lowerDamage', '† Lower damage dealt to you by d6')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('omensModal.rules.neutralize', '† Neutralize a Crit or Fumble')}
        </Typography>
        <Typography sx={{ color: morkBorgColors.white, textAlign: 'left' }}>
          {t('omensModal.rules.lowerDr', "† Lower one test's DR by -4")}
        </Typography>
      </Box>
    </MorkBorgModal>
  );
}
