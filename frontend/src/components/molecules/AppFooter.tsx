import { styled } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const Bar = styled('footer')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(0.5, 1),
  padding: theme.spacing(2, 0),
  marginTop: theme.spacing(3),
  borderTop: `2px solid ${morkBorgColors.black}`,
  [theme.breakpoints.up('sm')]: {
    justifyContent: 'center',
    gap: theme.spacing(1, 3),
  },
}));

const FooterLink = styled(Link)(({ theme }) => ({
  flex: `1 0 calc((100% - ${theme.spacing(2)}) / 3)`,
  minWidth: 0,
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5, 1),
  color: morkBorgColors.black,
  fontFamily: '"Antonio", sans-serif',
  fontSize: theme.typography.pxToRem(13),
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  textAlign: 'center',
  textUnderlineOffset: '6px',
  textDecorationThickness: '2px',
  [theme.breakpoints.up('sm')]: {
    flex: '0 0 auto',
  },
  '&:hover': {
    textDecorationLine: 'underline',
  },
}));

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
