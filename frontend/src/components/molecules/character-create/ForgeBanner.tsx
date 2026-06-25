import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const slideIn = keyframes`
  from { transform: translate(-50%, -16px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
`;

const AUTO_DISMISS_MS = 5000;

const styles = {
  root: {
    position: 'fixed' as const,
    top: { xs: 12, sm: 18 },
    left: '50%',
    transform: 'translate(-50%, 0)',
    zIndex: (theme: { zIndex: { snackbar: number } }) => theme.zIndex.snackbar,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    maxWidth: 'min(92vw, 520px)',
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
    px: { xs: 1.5, sm: 2 },
    py: { xs: 1, sm: 1.25 },
    animation: `${slideIn} 280ms cubic-bezier(0.22, 1, 0.36, 1)`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  copy: { minWidth: 0 },
  title: {
    display: 'block',
    color: morkBorgColors.black,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: { xs: '1.2rem', sm: '1.4rem' },
    letterSpacing: '0.04em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  },
  body: {
    display: 'block',
    color: morkBorgColors.black,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.8rem',
    letterSpacing: '0.04em',
    lineHeight: 1.2,
    mt: 0.4,
  },
  dismiss: {
    flexShrink: 0,
    minHeight: 44,
    borderRadius: 0,
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.yellow,
    border: `2px solid ${morkBorgColors.black}`,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.72rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    px: 1.25,
    '&:hover': { bgcolor: morkBorgColors.black, color: morkBorgColors.pink },
  },
};

export function ForgeBanner({ name, onClose }: { name: string; onClose: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    const id = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [onClose]);

  return (
    <Box role="status" aria-live="polite" data-testid="forge-banner" sx={styles.root}>
      <Box sx={styles.copy}>
        <Typography component="span" sx={styles.title}>
          {t('create.forgedTitle', '{{name}} joins the rack', { name })}
        </Typography>
        <Typography component="span" sx={styles.body}>
          {t('create.forgedBody', 'Your wretch is forged and saved.')}
        </Typography>
      </Box>
      <Button
        size="small"
        data-testid="forge-banner-dismiss"
        onClick={onClose}
        sx={styles.dismiss}
      >
        {t('create.forgedDismiss', 'Dismiss')}
      </Button>
    </Box>
  );
}
