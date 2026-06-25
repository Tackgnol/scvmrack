import { Box } from '@mui/material';
import { customStyles } from '@theme/morkBorgTheme';
import { useTranslation } from 'react-i18next';
import { NavLink } from './NavLink';

type HeaderDrawerNavProps = {
  isAuthenticated: boolean;
  homeUrl: string;
  onNavigate: () => void;
};

export function HeaderDrawerNav({ isAuthenticated, homeUrl, onNavigate }: HeaderDrawerNavProps) {
  const { t } = useTranslation();

  return (
    <Box sx={customStyles.header.drawerNav}>
      <NavLink to="/" text={t('nav.start', 'Start')} fullWidth onClick={onNavigate} />
      <NavLink
        to="/character"
        href={homeUrl}
        text={t('nav.home')}
        fullWidth
        onClick={onNavigate}
      />
      {isAuthenticated && (
        <NavLink to="/characters" text={t('nav.characters')} fullWidth onClick={onNavigate} />
      )}
      {isAuthenticated && (
        <NavLink to="/gm" text={t('nav.gm', 'GM')} fullWidth onClick={onNavigate} />
      )}
    </Box>
  );
}
