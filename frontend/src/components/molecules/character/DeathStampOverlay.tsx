import { DeadStamp } from '@/components';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';

const deathStampOverlayAnimation = keyframes`
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(2.6) rotate(-18deg);
        filter: blur(0.6px);
    }
    18% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.04) rotate(-12deg);
        filter: blur(0px);
    }
    70% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1) rotate(-12deg);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.02) rotate(-12deg);
    }
`;

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
});

function formatStampDate(d: Date) {
  const month = monthFormatter.format(d).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${month} ${day} ${year}`;
}

type DeathStampOverlayProps = {
  stampDate: Date;
  prefersReducedMotion: boolean;
  onAnimationEnd: () => void;
};

export function DeathStampOverlay({
  stampDate,
  prefersReducedMotion,
  onAnimationEnd,
}: DeathStampOverlayProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        pointerEvents: 'none',
      }}
    >
      <Box
        onAnimationEnd={onAnimationEnd}
        sx={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: 'min(92vw, 560px)',
          opacity: 0,
          transform: 'translate(-50%, -50%)',
          mixBlendMode: 'multiply',
          filter: 'drop-shadow(10px 12px 0 rgba(0,0,0,0.22))',
          animation: prefersReducedMotion
            ? 'none'
            : `${deathStampOverlayAnimation} 900ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        <DeadStamp
          mainText={t('characters.deadStampText', 'DEAD')}
          date={formatStampDate(stampDate)}
          mainColor={morkBorgColors.pink}
          dateColor={morkBorgColors.white}
        />
      </Box>
    </Box>
  );
}
