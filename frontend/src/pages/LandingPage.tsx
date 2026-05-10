import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Seo } from '@/seo/Seo';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { useCharacterId } from '@/hooks/useCharacterId';
import { buildHomeCallbackUrl } from '@/router/navigation';
import { useTranslation } from 'react-i18next';

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: { xs: 3, md: 4 },
    pb: { xs: 5, md: 7 },
  },
  heroBand: {
    position: 'relative' as const,
    overflow: 'hidden',
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      md: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)',
    },
    gap: { xs: 4, md: 5 },
    alignItems: 'stretch',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `7px 7px 0 ${morkBorgColors.pink}`,
    px: { xs: 2.25, sm: 3.5, md: 4.5 },
    py: { xs: 3.5, sm: 4.5, md: 5 },
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      inset: 0,
      pointerEvents: 'none',
      opacity: 0.06,
      backgroundImage:
        'repeating-linear-gradient(0deg, transparent 0, transparent 10px, #f5f5f5 11px), repeating-linear-gradient(90deg, transparent 0, transparent 18px, #f5f5f5 19px)',
    },
  },
  heroCopy: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: { xs: 360, md: 420 },
  },
  stamp: {
    display: 'inline-flex',
    alignItems: 'center',
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    transform: 'rotate(-0.7deg)',
    px: 1.5,
    py: 0.75,
    mb: { xs: 3, sm: 4 },
  },
  headline: {
    color: morkBorgColors.yellow,
    fontFamily: '"Caveat Brush", cursive',
    fontSize: { xs: '3.6rem', sm: '5rem', md: '6.4rem' },
    fontWeight: 400,
    lineHeight: 0.8,
    textTransform: 'uppercase' as const,
    maxWidth: 560,
    mb: 2.5,
    '& span': {
      display: 'block',
      color: morkBorgColors.pink,
      transform: 'rotate(-1.4deg)',
      transformOrigin: 'left center',
    },
  },
  lede: {
    color: morkBorgColors.white,
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: { xs: '1.05rem', sm: '1.18rem' },
    lineHeight: 1.55,
    maxWidth: 560,
    mb: 3.5,
  },
  ctaRow: {
    flexDirection: { xs: 'column', sm: 'row' } as const,
    alignItems: { xs: 'stretch', sm: 'center' },
    gap: 1.5,
    width: { xs: '100%', sm: 'auto' },
  },
  ctaPrimary: {
    minHeight: 48,
    bgcolor: morkBorgColors.pink,
    color: morkBorgColors.black,
    borderRadius: 0,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '1.15rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    px: 3.25,
    py: 1,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `4px 4px 0 ${morkBorgColors.yellow}`,
    transition:
      'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
    '&:hover': {
      bgcolor: morkBorgColors.yellow,
      transform: 'translate(-2px, -2px)',
      boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
    },
    '&:active': {
      transform: 'translate(0, 0)',
      boxShadow: `2px 2px 0 ${morkBorgColors.yellow}`,
    },
  },
  ctaSecondary: {
    minHeight: 48,
    bgcolor: 'transparent',
    color: morkBorgColors.yellow,
    borderRadius: 0,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '1.15rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    px: 3.25,
    py: 1,
    border: `3px solid ${morkBorgColors.yellow}`,
    transition:
      'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
    '&:hover': {
      bgcolor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      transform: 'translate(-2px, -2px)',
    },
    '&:active': {
      transform: 'translate(0, 0)',
    },
  },
  proofPanel: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'grid',
    alignContent: 'center',
  },
  mockSheet: {
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `8px 8px 0 ${morkBorgColors.black}`,
    transform: { xs: 'rotate(0.6deg)', md: 'rotate(1.4deg)' },
    p: { xs: 2, sm: 2.5 },
  },
  mockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 2,
    borderBottom: `3px solid ${morkBorgColors.black}`,
    pb: 1.25,
    mb: 1.5,
  },
  mockName: {
    fontFamily: '"MedievalSharp", serif',
    fontSize: { xs: '1.35rem', sm: '1.7rem' },
    lineHeight: 1,
  },
  mockClass: {
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.65rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    mt: 0.75,
  },
  mockBadge: {
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.yellow,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '1.7rem',
    lineHeight: 1,
    border: `2px solid ${morkBorgColors.black}`,
    px: 1,
    py: 0.75,
    minWidth: 54,
    textAlign: 'center' as const,
  },
  mockStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 1,
    mb: 1.5,
  },
  mockStat: {
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: `2px solid ${morkBorgColors.black}`,
    py: 1,
    textAlign: 'center' as const,
  },
  mockStatLabel: {
    display: 'block',
    color: morkBorgColors.pink,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.58rem',
    letterSpacing: '0.12em',
    lineHeight: 1,
  },
  mockStatValue: {
    display: 'block',
    color: morkBorgColors.yellow,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '1.5rem',
    lineHeight: 1,
    mt: 0.5,
  },
  mockRows: {
    display: 'grid',
    gap: 1,
  },
  mockRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    gap: 1,
    alignItems: 'center',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    px: 1,
    py: 0.75,
  },
  mockRowLabel: {
    color: morkBorgColors.yellow,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.62rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  mockRowText: {
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: '0.88rem',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  noticeGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
    gap: { xs: 1.5, md: 2 },
  },
  noticeCard: {
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
    p: { xs: 2.25, sm: 2.5 },
  },
  noticeKicker: {
    color: morkBorgColors.pink,
    fontFamily: '"Antonio", sans-serif',
    fontSize: '0.68rem',
    letterSpacing: '0.18em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    mb: 1.25,
  },
  noticeTitle: {
    color: morkBorgColors.yellow,
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '1.45rem',
    letterSpacing: '0.04em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    mb: 1,
  },
  noticeBody: {
    color: morkBorgColors.white,
    fontFamily: '"Alegreya", Georgia, serif',
    fontSize: '0.95rem',
    lineHeight: 1.55,
  },
};

const noticeKeys = ['book', 'guest', 'grave'] as const;
const mockStatKeys = ['agi', 'pre', 'str', 'tou'] as const;
const mockRowKeys = ['gear', 'omen', 'print'] as const;

export function LandingPage() {
  const { t } = useTranslation();
  const { lastCharacterId } = useCharacterId();

  return (
    <>
      <Seo
        title={t('landing.seo.title', 'Free Mork Borg Character Sheet')}
        description={t(
          'landing.seo.description',
          'Scvm Rack is a free interactive Mork Borg character sheet for generating, tracking, saving, and printing doomed scvms.',
        )}
        path="/"
        keywords={[
          'Mork Borg character sheet',
          'Mörk Borg character sheet',
          'Mork Borg character generator',
          'Scvm Rack',
        ]}
      />
      <Box sx={s.page}>
        <Box component="section" sx={s.heroBand}>
          <Box sx={s.heroCopy}>
            <Box component="span" sx={s.stamp}>
              {t('landing.stamp', 'Fan made. Non-commercial.')}
            </Box>

            <Typography component="h1" sx={s.headline}>
              {t('landing.headlineLine1', 'Doom')}
              <Box component="span">
                {t('landing.headlineLine2', 'on record')}
              </Box>
            </Typography>

            <Typography sx={s.lede}>
              {t(
                'landing.lede',
                'Generate a doomed scvm, track wounds, Omens, gear, powers, pets, and notes, then print the evidence when the table demands it.',
              )}
            </Typography>

            <Stack sx={s.ctaRow}>
              <Button
                component={Link}
                to={buildHomeCallbackUrl(lastCharacterId)}
                sx={s.ctaPrimary}
              >
                {t('landing.openSheet', 'Open sheet')}
              </Button>
              <Button
                component="a"
                href="https://morkborg.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={s.ctaSecondary}
              >
                {t('landing.sourcebook', 'Get the sourcebook')}
              </Button>
            </Stack>
          </Box>

          <Box sx={s.proofPanel} aria-hidden="true">
            <Box sx={s.mockSheet}>
              <Box sx={s.mockHeader}>
                <Box>
                  <Typography sx={s.mockName}>
                    {t('landing.mock.name', 'Rot-Prone Sigrid')}
                  </Typography>
                  <Typography sx={s.mockClass}>
                    {t('landing.mock.class', 'Gutterborn Scvm')}
                  </Typography>
                </Box>
                <Box sx={s.mockBadge}>HP 3</Box>
              </Box>

              <Box sx={s.mockStats}>
                {mockStatKeys.map((key) => (
                  <Box key={key} sx={s.mockStat}>
                    <Box component="span" sx={s.mockStatLabel}>
                      {t(`landing.mock.stats.${key}.label`)}
                    </Box>
                    <Box component="span" sx={s.mockStatValue}>
                      {t(`landing.mock.stats.${key}.value`)}
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={s.mockRows}>
                {mockRowKeys.map((key) => (
                  <Box key={key} sx={s.mockRow}>
                    <Typography sx={s.mockRowLabel}>
                      {t(`landing.mock.rows.${key}.label`)}
                    </Typography>
                    <Typography sx={s.mockRowText}>
                      {t(`landing.mock.rows.${key}.text`)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          component="section"
          sx={s.noticeGrid}
          aria-label={t('landing.noticeLabel', 'What to know')}
        >
          {noticeKeys.map((key, index) => (
            <Box key={key} sx={s.noticeCard}>
              <Typography sx={s.noticeKicker}>
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Typography component="h2" sx={s.noticeTitle}>
                {t(`landing.notices.${key}.title`)}
              </Typography>
              <Typography sx={s.noticeBody}>
                {t(`landing.notices.${key}.body`)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
