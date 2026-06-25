import { trackEvent } from '@/analytics/googleAnalytics';
import { loadLanguage } from '@/i18n';
import { morkBorgColors } from '@theme/morkBorgTheme';
import { styled } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Locale codes double as the visible labels — a Union Jack inline SVG is a lot of
// paths for one of two flags, so a stamped two-letter segmented control reads cleaner
// and drops the external flagsapi.com image (CSP-safe, offline-safe, on-brand caps).
const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pl', label: 'PL', name: 'Polski' },
] as const;

const Group = styled('div')({
  display: 'inline-flex',
  border: `1px solid ${morkBorgColors.yellow}`,
});

const Segment = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>(({ active }) => ({
  appearance: 'none',
  cursor: active ? 'default' : 'pointer',
  border: 'none',
  margin: 0,
  minWidth: 32,
  padding: '3px 8px',
  fontFamily: "'Antonio', sans-serif",
  fontWeight: 700,
  fontSize: '0.72rem',
  letterSpacing: '0.12em',
  lineHeight: 1,
  background: active ? morkBorgColors.yellow : 'transparent',
  color: active ? morkBorgColors.black : morkBorgColors.yellow,
  opacity: active ? 1 : 0.6,
  transition: 'background-color 150ms ease, color 150ms ease, opacity 150ms ease',
  '&:hover': {
    opacity: 1,
    color: active ? morkBorgColors.black : morkBorgColors.pink,
  },
  '&:focus-visible': {
    outline: `2px solid ${morkBorgColors.pink}`,
    outlineOffset: 2,
  },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
}));

// EN/PL language switch for the header. Self-contained: drives i18next directly
// (changeLanguage lazy-loads the pl bundle and caches the choice in localStorage),
// so it works on any route without the character context.
export function LanguageToggle() {
  const { i18n } = useTranslation();
  // Use i18n.language (the *selected* locale, set synchronously by the detector /
  // changeLanguage) rather than resolvedLanguage, which transiently reports the
  // fallback while the pl bundle finishes loading and would mis-highlight the tab.
  const current = (i18n.language || 'en').split('-')[0];

  const select = (code: string) => {
    if (code === current) return;
    void (async () => {
      await loadLanguage(code);
      await i18n.changeLanguage(code);
      trackEvent('language_changed', { from: current, to: code });
    })();
  };

  return (
    <Group role="group" aria-label="Language">
      {LOCALES.map(({ code, label, name }) => {
        const active = current === code;
        return (
          <Segment
            key={code}
            type="button"
            active={active}
            aria-pressed={active}
            aria-label={name}
            data-testid={`language-${code}`}
            onClick={() => select(code)}
          >
            {label}
          </Segment>
        );
      })}
    </Group>
  );
}
