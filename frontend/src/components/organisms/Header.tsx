import { loginUrl, profileUrl } from '@/auth';
import { trackEvent } from '@/analytics/googleAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { appHistory } from '@/router/history';
import {
  buildHomeCallbackUrl,
  buildPrintCallbackUrl,
} from '@/router/navigation';
import { Flag } from '@components/atoms/Flag';
import { FlagContainer } from '@components/atoms/FlagContainer';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PrintIcon from '@mui/icons-material/Print';
import SyncIcon from '@mui/icons-material/Sync';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouterState } from '@tanstack/react-router';
import { customStyles } from '@theme/morkBorgTheme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BoneIconContainer,
  BoneBar,
  StyledNavLink,
  ScvmCountBadge,
} from './Header.styled';
import { $api } from '@/api';

// --- The Dynamic Bone Icon (Hamburger to X) ---
const BoneIcon = ({ isOpen }: { isOpen: boolean }) => (
  <BoneIconContainer sx={customStyles.boneIconGap(isOpen)}>
    {[1, 2, 3].map((i) => (
      <BoneBar key={i} index={i} isOpen={isOpen} />
    ))}
  </BoneIconContainer>
);

function NavLink({
  to,
  href,
  text,
  onClick,
  fullWidth,
}: {
  to: string;
  href?: string;
  text: string;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isActive =
    to === '/character'
      ? pathname === '/character' || pathname.startsWith('/character/')
      : pathname === to;

  const handleClick = href
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        onClick?.();
        void appHistory.push(href);
      }
    : onClick;

  return (
    <StyledNavLink
      to={to}
      onClick={handleClick}
      isActive={isActive}
      fullWidth={fullWidth}
      data-testid={`nav-link-${to.replace(/\//g, '') || 'home'}`}
    >
      {text}
    </StyledNavLink>
  );
}

export default function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, signOut } = useAuth();
  const {
    isSaving,
    characterId,
    lastCharacterId,
    validationIssues = [],
  } = useCharacter();
  const { showBugReport } = useErrorFeedback();
  const { data: countData } = $api.useQuery('get', '/api/characters/count');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSaving, setShowSaving] = useState(false);
  const savingShowTimeoutRef = useRef<number | null>(null);
  const savingHideTimeoutRef = useRef<number | null>(null);
  const savingVisibleSinceRef = useRef<number | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const homeUrl = buildHomeCallbackUrl(characterId || lastCharacterId);
  const isLandingRoute = pathname === '/';
  const isSheetRoute =
    pathname === '/character' || pathname.startsWith('/character/');
  const activeCharacterId = characterId || lastCharacterId || undefined;
  const validationSummary = validationIssues
    .map(({ message }) => message)
    .join(' · ');
  const validationCount = validationIssues.length;
  const validationLabel = validationSummary
    ? validationCount === 1
      ? `${t('validation.summaryPrefix', 'Fix')}: ${validationSummary}`
      : `${t('validation.summaryPrefix', 'Fix')}: ${t(
          'validation.issueCount',
          '{{count}} issues',
          { count: validationCount }
        )}`
    : '';

  useEffect(() => {
    const SHOW_DELAY_MS = 140;
    const MIN_VISIBLE_MS = 420;

    if (isSaving) {
      if (!showSaving && savingShowTimeoutRef.current === null) {
        savingShowTimeoutRef.current = window.setTimeout(() => {
          setShowSaving(true);
          savingVisibleSinceRef.current = Date.now();
          savingShowTimeoutRef.current = null;
        }, SHOW_DELAY_MS);
      }
    } else {
      if (savingShowTimeoutRef.current !== null) {
        window.clearTimeout(savingShowTimeoutRef.current);
        savingShowTimeoutRef.current = null;
      }
      if (showSaving) {
        const elapsed =
          Date.now() - (savingVisibleSinceRef.current ?? Date.now());
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        savingHideTimeoutRef.current = window.setTimeout(() => {
          setShowSaving(false);
          savingVisibleSinceRef.current = null;
          savingHideTimeoutRef.current = null;
        }, remaining);
      }
    }

    return () => {
      if (savingShowTimeoutRef.current !== null) {
        window.clearTimeout(savingShowTimeoutRef.current);
        savingShowTimeoutRef.current = null;
      }
      if (savingHideTimeoutRef.current !== null) {
        window.clearTimeout(savingHideTimeoutRef.current);
        savingHideTimeoutRef.current = null;
      }
    };
  }, [isSaving, showSaving]);

  const getStatusChip = () => {
    if (showSaving)
      return (
        <Chip
          data-testid="saving-chip"
          size="small"
          icon={<SyncIcon sx={customStyles.header.syncIcon} />}
          label={t('status.saving')}
          variant="outlined"
          sx={customStyles.header.savingChip}
        />
      );
    return (
      <Chip
        data-testid="synced-chip"
        size="small"
        icon={<CloudDoneIcon />}
        label={t('status.synced')}
        color="success"
        variant="outlined"
        sx={customStyles.statusChip.common}
      />
    );
  };

  const getValidationChip = () => {
    if (!validationSummary) return null;

    return (
      <Tooltip title={validationSummary} placement="bottom">
        <Chip
          data-testid="validation-issues-chip"
          size="small"
          icon={<WarningAmberIcon />}
          label={validationLabel}
          aria-label={`${validationLabel}: ${validationSummary}`}
          variant="outlined"
          sx={customStyles.header.validationChip}
        />
      </Tooltip>
    );
  };

  const handlePrint = () => {
    const printUrl = buildPrintCallbackUrl(characterId || lastCharacterId);
    window.open(printUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReportBug = useCallback(
    (source: string) => {
      showBugReport({
        source,
        route: pathname,
        characterId: activeCharacterId,
      });
    },
    [activeCharacterId, pathname, showBugReport]
  );

  const handleLogout = useCallback(() => {
    void signOut.mutateAsync();
  }, [signOut]);

  const authButtonHref = isAuthenticated ? profileUrl() : loginUrl();

  return (
    <>
      <Paper data-testid="app-title" sx={customStyles.header.paper}>
        <Box sx={customStyles.header.container(isMobile)}>
          <Box sx={customStyles.header.titleBox}>
            <Box sx={customStyles.header.titleRow(isMobile)}>
              <Typography
                variant="h1"
                aria-label={`${t('app.title', 'Scvmrack')} ${t('app.alphaBadge', 'Alpha')}`}
                sx={customStyles.header.title(isMobile)}
              >
                SC<span>V</span>MRACK
              </Typography>
              <Box
                component="span"
                aria-hidden="true"
                sx={customStyles.header.alphaBadge(isMobile)}
              >
                {t('app.alphaBadge', 'Alpha')}
              </Box>
            </Box>
            <Typography
              variant="subtitle1"
              component="p"
              sx={customStyles.header.subtitle(isMobile)}
            >
              {t('app.subtitle')}
            </Typography>
          </Box>

          {isMobile ? (
            <Box sx={customStyles.header.mobileMenuButton}>
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                aria-label={t('common.openMenu', 'Open menu')}
              >
                <BoneIcon isOpen={false} />
              </IconButton>
            </Box>
          ) : (
            <Box sx={customStyles.header.desktopNav}>
              <Box sx={customStyles.header.topBar}>
                {isSheetRoute && getStatusChip()}
                {isSheetRoute && getValidationChip()}
                {isSheetRoute && (
                  <Button
                    data-testid="header-print-button"
                    onClick={handlePrint}
                    startIcon={<PrintIcon sx={{ fontSize: 14 }} />}
                    sx={customStyles.header.printButton}
                  >
                    {t('actions.print')}
                  </Button>
                )}
                <Button
                  data-testid="header-report-bug-button"
                  onClick={() => handleReportBug('header_bug_report')}
                  startIcon={<BugReportIcon sx={{ fontSize: 14 }} />}
                  sx={customStyles.header.reportBugButton}
                >
                  {t('feedback.reportBugAction', 'Report bug')}
                </Button>
                <FlagContainer>
                  <Flag locale="en" />
                  <Flag locale="pl" />
                </FlagContainer>
                <IconButton
                  data-testid="auth-button"
                  component="a"
                  href={authButtonHref}
                  target={isAuthenticated ? '_blank' : undefined}
                  rel={isAuthenticated ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    if (!isAuthenticated) {
                      trackEvent('sign_in', { method: 'logto' });
                    }
                  }}
                  sx={customStyles.header.authButton}
                  aria-label={
                    isAuthenticated
                      ? t('auth.profile', 'Profile')
                      : t('auth.loginSignup', 'Log In / Sign Up')
                  }
                >
                  {isAuthenticated ? <PersonIcon /> : <PersonOutlineIcon />}
                </IconButton>
                {isAuthenticated && (
                  <IconButton
                    data-testid="logout-button"
                    onClick={handleLogout}
                    sx={customStyles.header.authButton}
                    aria-label={t('auth.logout', 'Log Out')}
                  >
                    <LogoutIcon />
                  </IconButton>
                )}
              </Box>
              {countData?.total !== undefined && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mr: 2,
                    mb: 1.5,
                  }}
                >
                  <ScvmCountBadge data-testid="scvm-count-badge">
                    {countData.total} {t('header.scvmsCreated', 'SCVMS')}... AND
                    COUNTING
                  </ScvmCountBadge>
                </Box>
              )}
              <Box sx={customStyles.header.navBar}>
                <NavLink to="/" text={t('nav.start', 'Start')} />
                <NavLink to="/character" href={homeUrl} text={t('nav.home')} />
                {isAuthenticated && (
                  <NavLink to="/characters" text={t('nav.characters')} />
                )}
                <NavLink to="/faq" text={t('nav.faq')} />
                <NavLink to="/release" text={t('nav.release')} />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
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
          <IconButton
            onClick={() => setMobileMenuOpen(false)}
            aria-label={t('common.close', 'Close')}
          >
            <BoneIcon isOpen={true} />
          </IconButton>
        </Box>

        <Box sx={customStyles.header.drawerNav}>
          <NavLink
            to="/"
            text={t('nav.start', 'Start')}
            fullWidth
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavLink
            to="/character"
            href={homeUrl}
            text={t('nav.home')}
            fullWidth
            onClick={() => setMobileMenuOpen(false)}
          />
          {isAuthenticated && (
            <NavLink
              to="/characters"
              text={t('nav.characters')}
              fullWidth
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          <NavLink
            to="/faq"
            text={t('nav.faq')}
            fullWidth
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavLink
            to="/release"
            text={t('nav.release')}
            fullWidth
            onClick={() => setMobileMenuOpen(false)}
          />
        </Box>

        <Box sx={customStyles.header.drawerFooter}>
          <Box sx={customStyles.header.drawerStatusBox}>
            {!isLandingRoute && isSheetRoute && getStatusChip()}
            {!isLandingRoute && isSheetRoute && getValidationChip()}
            {isSheetRoute && (
              <Button
                data-testid="drawer-print-button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handlePrint();
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
                setMobileMenuOpen(false);
                handleReportBug('header_drawer_bug_report');
              }}
              startIcon={<BugReportIcon fontSize="small" />}
              sx={customStyles.header.drawerReportBugButton}
            >
              {t('feedback.reportBugAction', 'Report bug')}
            </Button>
          </Box>
          <Box sx={customStyles.header.drawerAuthBox}>
            <FlagContainer>
              <Flag locale="en" />
              <Flag locale="pl" />
            </FlagContainer>
            <IconButton
              component="a"
              href={authButtonHref}
              target={isAuthenticated ? '_blank' : undefined}
              rel={isAuthenticated ? 'noopener noreferrer' : undefined}
              sx={customStyles.header.drawerAuthButton}
              aria-label={
                isAuthenticated
                  ? t('auth.profile', 'Profile')
                  : t('auth.loginSignup', 'Log In / Sign Up')
              }
            >
              {isAuthenticated ? (
                <PersonIcon fontSize="large" />
              ) : (
                <PersonOutlineIcon fontSize="large" />
              )}
            </IconButton>
            {isAuthenticated && (
              <IconButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                sx={customStyles.header.drawerAuthButton}
                aria-label={t('auth.logout', 'Log Out')}
              >
                <LogoutIcon fontSize="large" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
