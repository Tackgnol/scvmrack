import { Alert, Box, Button, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import type { LegalChangeBannerProps } from './LegalChangeBanner.models';

/** Shows a significant legal change once per signed-in user, browser, and notice date. */
export function LegalChangeBanner({ notice }: LegalChangeBannerProps) {
  const { user, isAuthenticated } = useAuth({ bootstrapAnonymous: false });
  const { t, i18n } = useTranslation();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const key = `scvmrack-legal-notice:${user?.id}:${notice.kind}:${notice.date}`;
  let previouslyDismissed = false;
  try {
    previouslyDismissed = localStorage.getItem(key) === 'dismissed';
  } catch {
    // The notice remains visible when browser storage is unavailable.
  }
  if (!isAuthenticated || !user?.id || dismissedKey === key || previouslyDismissed) return null;

  const locale = i18n.language.startsWith('pl') ? 'pl' : 'en';
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
  const path = notice.kind === 'terms' ? '/terms' : '/privacy';
  const dismiss = () => {
    try {
      localStorage.setItem(key, 'dismissed');
    } catch {
      // Dismiss only for this visit when browser storage is unavailable.
    }
    setDismissedKey(key);
  };

  return (
    <Alert severity="info" role="status" sx={{ mb: 2 }}>
      <Box>
        <Typography component="strong" sx={{ display: 'block', fontWeight: 700 }}>
          {t(`legalNotice.${notice.kind}Changed`, { date: formatDate(notice.date) })}
        </Typography>
        <Typography component="span">{notice.summary[locale]}</Typography>
        <Typography component="span" sx={{ display: 'block' }}>
          {t('legalNotice.effective', { date: formatDate(notice.effectiveDate) })}
        </Typography>
        <Button component={Link} to={path} size="small">{t('legalNotice.read')}</Button>
        <Button onClick={dismiss} size="small">{t('legalNotice.dismiss')}</Button>
      </Box>
    </Alert>
  );
}
