import BugReportIcon from '@mui/icons-material/BugReport';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PrintIcon from '@mui/icons-material/Print';
import { Box, Button } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';
import { PartyTriggerPill } from '@/components/molecules/party/PartyTriggerPill';
import { LanguageToggle } from './LanguageToggle';
import { NavLink } from './NavLink';
import { HeaderStatusChip } from './HeaderStatusChip';
import { HeaderValidationChip } from './HeaderValidationChip';
import { ScvmCountBadge } from './Header.styled';

type HeaderDesktopBarProps = {
  isSheetRoute: boolean;
  isAuthenticated: boolean;
  authButtonHref: string;
  showSaving: boolean;
  validationSummary: string;
  validationLabel: string;
  homeUrl: string;
  scvmCount?: number;
  onPrint: () => void;
  onReportBug: () => void;
  onAuthButtonClick: () => void;
  onLogout: () => void;
};

export function HeaderDesktopBar({
  isSheetRoute,
  isAuthenticated,
  authButtonHref,
  showSaving,
  validationSummary,
  validationLabel,
  homeUrl,
  scvmCount,
  onPrint,
  onReportBug,
  onAuthButtonClick,
  onLogout,
}: HeaderDesktopBarProps) {
  const { t } = useTranslation();

  return (
    <Box sx={customStyles.header.desktopNav}>
      <Box sx={customStyles.header.topBar}>
        <PartyTriggerPill />
        {isSheetRoute && <HeaderStatusChip saving={showSaving} />}
        {isSheetRoute && (
          <HeaderValidationChip summary={validationSummary} label={validationLabel} />
        )}
        {isSheetRoute && (
          <Button
            data-testid="header-print-button"
            onClick={onPrint}
            startIcon={<PrintIcon sx={{ fontSize: 14 }} />}
            sx={customStyles.header.printButton}
          >
            {t('actions.print')}
          </Button>
        )}
        <Button
          data-testid="header-report-bug-button"
          onClick={onReportBug}
          startIcon={<BugReportIcon sx={{ fontSize: 14 }} />}
          sx={customStyles.header.reportBugButton}
        >
          {t('feedback.reportBugAction', 'Report bug')}
        </Button>
        <Button
          data-testid="auth-button"
          component="a"
          href={authButtonHref}
          target={isAuthenticated ? '_blank' : undefined}
          rel={isAuthenticated ? 'noopener noreferrer' : undefined}
          onClick={onAuthButtonClick}
          startIcon={
            isAuthenticated ? (
              <PersonIcon sx={{ fontSize: 16 }} />
            ) : (
              <PersonOutlineIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={customStyles.header.authButton(isAuthenticated)}
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
            data-testid="logout-button"
            onClick={onLogout}
            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            sx={customStyles.header.logoutButton}
            aria-label={t('auth.logout', 'Log Out')}
          >
            {t('auth.logout', 'Log Out')}
          </Button>
        )}
        <LanguageToggle />
      </Box>
      {scvmCount !== undefined && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mr: 2,
            mb: 1.5,
          }}
        >
          <ScvmCountBadge data-testid="scvm-count-badge">
            {t('header.scvmCount', '{{count}} scvms... and counting', {
              count: scvmCount,
            })}
          </ScvmCountBadge>
        </Box>
      )}
      <Box sx={customStyles.header.navBar}>
        <NavLink to="/" text={t('nav.start', 'Start')} />
        <NavLink to="/character" href={homeUrl} text={t('nav.home')} />
        {isAuthenticated && <NavLink to="/characters" text={t('nav.characters')} />}
        {isAuthenticated && <NavLink to="/gm" text={t('nav.gm', 'GM')} />}
      </Box>
    </Box>
  );
}
