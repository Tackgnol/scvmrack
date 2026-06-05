import { Box, Drawer, IconButton, Typography } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';
import { BoneIcon } from './BoneIcon';
import { HeaderDrawerActions } from './HeaderDrawerActions';
import { HeaderDrawerNav } from './HeaderDrawerNav';

type HeaderMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  isSheetRoute: boolean;
  isAuthenticated: boolean;
  authButtonHref: string;
  showSaving: boolean;
  validationSummary: string;
  validationLabel: string;
  homeUrl: string;
  onPrint: () => void;
  onReportBug: () => void;
  onLogout: () => void;
};

export function HeaderMobileDrawer({
  open,
  onClose,
  isSheetRoute,
  isAuthenticated,
  authButtonHref,
  showSaving,
  validationSummary,
  validationLabel,
  homeUrl,
  onPrint,
  onReportBug,
  onLogout,
}: HeaderMobileDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            ...customStyles.drawer.paper,
            ...customStyles.header.drawerPaper,
          },
        },
      }}
    >
      <Box sx={customStyles.header.drawerHeader}>
        <Typography variant="h4" sx={customStyles.header.drawerTitle}>
          THE VAULT
        </Typography>
        <IconButton onClick={onClose} aria-label={t('common.close', 'Close')}>
          <BoneIcon isOpen={true} />
        </IconButton>
      </Box>

      <HeaderDrawerNav
        isAuthenticated={isAuthenticated}
        homeUrl={homeUrl}
        onNavigate={onClose}
      />

      <HeaderDrawerActions
        isSheetRoute={isSheetRoute}
        isAuthenticated={isAuthenticated}
        authButtonHref={authButtonHref}
        showSaving={showSaving}
        validationSummary={validationSummary}
        validationLabel={validationLabel}
        onClose={onClose}
        onPrint={onPrint}
        onReportBug={onReportBug}
        onLogout={onLogout}
      />
    </Drawer>
  );
}
