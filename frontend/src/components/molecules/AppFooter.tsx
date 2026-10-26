import { styled } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const Bar = styled('footer')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  alignItems: 'center',
  gap: theme.spacing(0.5, 1),
  padding: theme.spacing(2, 0),
  marginTop: theme.spacing(3),
  borderTop: `2px solid ${morkBorgColors.black}`,
  [theme.breakpoints.up('sm')]: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(1, 3),
  },
}));

const FooterLink = styled(Link)({
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 8px',
  color: morkBorgColors.black,
  fontFamily: '"Antonio", sans-serif',
  fontSize: '0.8rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  textAlign: 'center',
  textUnderlineOffset: '6px',
  textDecorationThickness: '2px',
  '&:last-of-type': {
    gridColumn: '1 / -1',
  },
  '&:hover': {
    textDecorationLine: 'underline',
  },
});

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <Bar className="print-hidden">
      <FooterLink to="/faq">{t('nav.faq')}</FooterLink>
      <FooterLink to="/release">{t('nav.release')}</FooterLink>
      <FooterLink to="/owlbear">{t('nav.owlbear')}</FooterLink>
      <FooterLink to="/privacy">{t('nav.privacy')}</FooterLink>
      <FooterLink to="/terms">{t('nav.terms')}</FooterLink>
      <FooterLink to="/legal">{t('nav.legal')}</FooterLink>
      <FooterLink to="/report">{t('report.link', 'Report a class')}</FooterLink>
    </Bar>
  );
}
