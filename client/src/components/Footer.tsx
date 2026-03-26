import { Box, Button, Typography } from '@mui/material';
import { requestOpenPrivacyDrawer } from '@/privacy/privacyDrawerBus';
import { customStyles } from '@theme/morkBorgTheme.ts';
import { Trans, useTranslation } from 'react-i18next';

interface FooterProps {
  onGenerateNew: () => void;
  generateNewLabel?: string;
  onKillScvm?: () => void;
}

export default function Footer({
  onGenerateNew,
  generateNewLabel,
  onKillScvm,
}: FooterProps) {
  const { t } = useTranslation();

  const handleOpenPrivacy = () => {
    requestOpenPrivacyDrawer();
  };

  return (
    <Box sx={customStyles.footer.paper}>
      <Box sx={customStyles.footer.buttonContainer} className="print-hidden">
        <Button
          data-testid="generate-new-button"
          onClick={onGenerateNew}
          sx={customStyles.footerButton}
        >
          {generateNewLabel || t('actions.generateNew')}
        </Button>
        {onKillScvm && (
          <Button
            data-testid="kill-scvm-button"
            onClick={onKillScvm}
            sx={customStyles.killButton}
          >
            {t('actions.killScvm', 'Kill Scvm')}
          </Button>
        )}
      </Box>
      <Typography sx={customStyles.footer.title}>
        <Trans i18nKey="footer.worldEnding">
          The <span>World</span> Is <span>Ending</span>
        </Trans>
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1,
          color: 'rgba(10, 10, 10, 0.35)',
          lineHeight: 1.6,
          fontSize: '0.65rem',
        }}
      >
        <Trans
          i18nKey="footer.legalNotice"
          components={{
            privacyLink: (
              <Box
                component="button"
                type="button"
                onClick={handleOpenPrivacy}
                sx={{
                  ml: 0.5,
                  p: 0,
                  border: 0,
                  bgcolor: 'transparent',
                  color: 'rgba(10, 10, 10, 0.5)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  font: 'inherit',
                  '&:hover': {
                    color: 'rgba(10, 10, 10, 0.8)',
                  },
                }}
              />
            ),
          }}
        />
      </Typography>
    </Box>
  );
}
