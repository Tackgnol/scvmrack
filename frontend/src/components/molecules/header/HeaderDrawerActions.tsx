import BugReportIcon from '@mui/icons-material/BugReport';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PrintIcon from '@mui/icons-material/Print';
import { Box, Button } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';
import { HeaderStatusChip } from './HeaderStatusChip';
import { HeaderValidationChip } from './HeaderValidationChip';

type HeaderDrawerActionsProps = {
  isSheetRoute: boolean;
  isAuthenticated: boolean;
  authButtonHref: string;
  showSaving: boolean;
  validationSummary: string;
  validationLabel: string;
  onClose: () => void;
  onPrint: () => void;
  onReportBug: () => void;
  onLogout: () => void;
};

export function HeaderDrawerActions({
  isSheetRoute,
  isAuthenticated,
  authButtonHref,
  showSaving,
  validationSummary,
  validationLabel,
  onClose,
  onPrint,
  onReportBug,
  onLogout,
}: HeaderDrawerActionsProps) {
  const { t } = useTranslation();

  return (
    <Box sx={customStyles.header.drawerFooter}>
      <Box sx={customStyles.header.drawerStatusBox}>
        {isSheetRoute && <HeaderStatusChip saving={showSaving} />}
        {isSheetRoute && (
          <HeaderValidationChip summary={validationSummary} label={validationLabel} />
        )}
        {isSheetRoute && (
          <Button
            data-testid="drawer-print-button"
            onClick={() => {
              onClose();
              onPrint();
            }}
            startIcon={<PrintIcon fontSize="small" />}
            sx={customStyles.header.drawerPrintButton}
          >
            {t('actions.print')}
          </Button>
        )}
        <Button
          data-testid="drawer-report-bug-button"
          onClick={() => {
            onClose();
            onReportBug();
          }}
          startIcon={<BugReportIcon fontSize="small" />}
          sx={customStyles.header.drawerReportBugButton}
        >
          {t('feedback.reportBugAction', 'Report bug')}
        </Button>
      </Box>
      <Box sx={customStyles.header.drawerAuthBox}>
        <Button
          component="a"
          href={authButtonHref}
          target={isAuthenticated ? '_blank' : undefined}
          rel={isAuthenticated ? 'noopener noreferrer' : undefined}
          startIcon={
            isAuthenticated ? (
              <PersonIcon fontSize="small" />
            ) : (
              <PersonOutlineIcon fontSize="small" />
            )
          }
          sx={customStyles.header.drawerAuthButton(isAuthenticated)}
          aria-label={
            isAuthenticated
              ? `${t('auth.loggedIn', 'Logged In')}: ${t('auth.profile', 'Profile')}`
              : t('auth.loginSignup', 'Log In / Sign Up')
          }
        >
          {isAuthenticated
            ? t('auth.loggedIn', 'Logged In')
            : t('auth.loginSignup', 'Log In / Sign Up')}
        </Button>
        {isAuthenticated && (
          <Button
            onClick={() => {
              onClose();
              onLogout();
            }}
            startIcon={<LogoutIcon fontSize="small" />}
            sx={customStyles.header.drawerLogoutButton}
            aria-label={t('auth.logout', 'Log Out')}
          >
            {t('auth.logout', 'Log Out')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
