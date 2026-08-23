import { styled } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const Bar = styled('footer')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0 20px',
  padding: '12px 16px 20px',
  marginTop: 'auto',
});

const FooterLink = styled(Link)({
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 14px',
  color: morkBorgColors.black,
  fontFamily: '"Antonio", sans-serif',
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  border: `1px solid rgba(10, 10, 10, 0.45)`,
  transition: 'border-color 120ms ease-out, color 120ms ease-out',
  '&:hover': {
    color: morkBorgColors.pink,
    borderColor: morkBorgColors.pink,
  },
  '&:focus-visible': {
    outline: `2px solid ${morkBorgColors.pink}`,
    outlineOffset: '2px',
  },
});

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <Bar className="print-hidden">
      <FooterLink to="/faq">{t('nav.faq')}</FooterLink>
      <FooterLink to="/release">{t('nav.release')}</FooterLink>
      <FooterLink to="/owlbear">{t('nav.owlbear')}</FooterLink>
    </Bar>
  );
}
