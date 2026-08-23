import { loginUrl, profileUrl } from '@/auth';
import { trackEvent } from '@/analytics/googleAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { useSavingIndicator } from '@/hooks/useSavingIndicator';
import {
  buildHomeCallbackUrl,
  buildPrintCallbackUrl,
} from '@/router/navigation';
import { isSheetRoutePath } from '@/router/routeClassification';
import { BoneIcon } from '@components/molecules/header/BoneIcon';
import { HeaderDesktopBar } from '@components/molecules/header/HeaderDesktopBar';
import { HeaderMobileDrawer } from '@components/molecules/header/HeaderMobileDrawer';
import MiseryHeaderLink from '@/components/molecules/character/MiseryHeaderLink';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouterState } from '@tanstack/react-router';
import { customStyles } from '@theme/morkBorgTheme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { $api } from '@/api';

export default function Header() {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isJoinRoute = pathname.startsWith('/join/');
  const { isAuthenticated, signOut } = useAuth({
    bootstrapAnonymous: !isJoinRoute,
    fetchSession: !isJoinRoute,
  });
  const {
    isSaving,
    character,
    characterId,
    lastCharacterId,
    validationIssues = [],
  } = useCharacter();
  const { showBugReport } = useErrorFeedback();
  const { data: countData } = $api.useQuery(
    'get',
    '/api/characters/count',
    {},
    { enabled: !isJoinRoute }
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showSaving = useSavingIndicator(isSaving);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const homeUrl = buildHomeCallbackUrl(characterId || lastCharacterId);
  const isSheetRoute = isSheetRoutePath(pathname);
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

  const handlePrint = () => {
    const printUrl = buildPrintCallbackUrl(characterId || lastCharacterId);
    window.open(printUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReportBug = (source: string) => {
    showBugReport({
      source,
      route: pathname,
      characterId: activeCharacterId,
    });
  };

  const handleLogout = () => {
    void signOut.mutateAsync();
  };

  const handleAuthButtonClick = () => {
    if (!isAuthenticated) {
      trackEvent('sign_in', { method: 'logto' });
    }
  };

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
              {isSheetRoute && character && (
                <MiseryHeaderLink count={character.miseryCount} />
              )}
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
            <HeaderDesktopBar
              isSheetRoute={isSheetRoute}
              isAuthenticated={isAuthenticated}
              authButtonHref={authButtonHref}
              showSaving={showSaving}
              validationSummary={validationSummary}
              validationLabel={validationLabel}
              homeUrl={homeUrl}
              scvmCount={countData?.total}
              onPrint={handlePrint}
              onReportBug={() => handleReportBug('header_bug_report')}
              onAuthButtonClick={handleAuthButtonClick}
              onLogout={handleLogout}
            />
          )}
        </Box>
      </Paper>

      <HeaderMobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isSheetRoute={isSheetRoute}
        isAuthenticated={isAuthenticated}
        authButtonHref={authButtonHref}
        showSaving={showSaving}
        validationSummary={validationSummary}
        validationLabel={validationLabel}
        homeUrl={homeUrl}
        onPrint={handlePrint}
        onReportBug={() => handleReportBug('header_drawer_bug_report')}
        onLogout={handleLogout}
      />
    </>
  );
}
