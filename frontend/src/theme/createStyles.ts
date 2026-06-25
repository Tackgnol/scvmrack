import { keyframes } from '@mui/system';
import { morkBorgColors } from '@/theme/morkBorgTheme';

/**
 * Shared styling for the character-creation flow. Lives in the theme layer so
 * the flow's components stay markup-only and the neo-brutalist primitives
 * (fonts, the stamped border + hard offset shadow, the blood red) are defined
 * once instead of re-typed as literals in every section.
 */

// ── Font tokens ──────────────────────────────────────────────────────────────
export const fonts = {
  display: '"Bebas Neue", sans-serif',
  label: '"Antonio", sans-serif',
  body: '"Alegreya", Georgia, serif',
  accent: '"Caveat Brush", cursive',
  medieval: '"MedievalSharp", serif',
} as const;

// ── Neo-brutalist primitives ─────────────────────────────────────────────────
/** The stamped 3px black outline used on every card/tile/badge. */
const brutalBorder = `3px solid ${morkBorgColors.black}`;
/** Hard offset "stamp" shadow — the brand's depth cue. */
const hardShadow = (color: string, size = 4): string =>
  `${size}px ${size}px 0 ${color}`;

const diceKick = keyframes`
  0% {
    transform: rotate(0deg) scale(1);
  }
  45% {
    transform: rotate(-12deg) scale(1.12);
  }
  100% {
    transform: rotate(0deg) scale(1);
  }
`;

// ── DraftSection (shared section frame + reroll button) ──────────────────────
export const sectionStyles = {
  root: {
    position: 'relative' as const,
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black, 5),
    p: { xs: 1.5, sm: 2 },
    mb: { xs: 1.5, md: 2 },
    minHeight: 142,
    overflow: 'hidden',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'flex-start',
    columnGap: { xs: 0.75, sm: 1 },
    mb: 1,
  },
  title: {
    display: 'inline-block',
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black),
    fontFamily: fonts.display,
    fontSize: { xs: '1.25rem', sm: '1.45rem' },
    letterSpacing: '0.04em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    px: 1,
    py: 0.55,
    transform: 'rotate(-0.45deg)',
  },
  actionRow: {
    display: 'flex',
    gap: 0.75,
    justifySelf: 'end',
    pt: 0.25,
  },
  headerAccessory: {
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    px: 0.5,
    pt: { xs: 0.05, sm: 0 },
  },
  rerollButton: (rolling: boolean) => ({
    width: 52,
    height: 50,
    flexDirection: 'column',
    gap: 0.1,
    bgcolor: morkBorgColors.pink,
    color: morkBorgColors.black,
    border: brutalBorder,
    borderRadius: 0,
    boxShadow: hardShadow(morkBorgColors.yellow),
    transition:
      'transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1), background-color 160ms cubic-bezier(0.22, 1, 0.36, 1)',
    '& .draft-die-icon': {
      width: 25,
      height: 25,
      objectFit: 'contain',
      display: 'block',
    },
    '& .draft-roll-label': {
      display: 'block',
      fontFamily: fonts.label,
      fontSize: '0.48rem',
      letterSpacing: '0.12em',
      lineHeight: 1,
      textTransform: 'uppercase',
      transform: 'translateX(0.04em)',
    },
    '&:hover': {
      bgcolor: morkBorgColors.yellow,
      transform: 'translate(-2px, -2px) rotate(-2deg)',
      boxShadow: hardShadow(morkBorgColors.pink, 6),
      '& .draft-die-icon': {
        animation: `${diceKick} 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
      },
    },
    '&:active': {
      transform: 'translate(0, 0)',
      boxShadow: hardShadow(morkBorgColors.yellow, 1),
    },
    // Only the section being rolled changes appearance (yellow + kicking die).
    // Sibling buttons are disabled while a roll is in flight, but they keep their
    // resting look so a single re-roll doesn't flash every button grey — which read
    // as "everything re-rolled". The roll's pulse stays isolated to the clicked one.
    '&.Mui-disabled': {
      bgcolor: rolling ? morkBorgColors.yellow : morkBorgColors.pink,
      color: morkBorgColors.black,
      opacity: rolling ? 0.9 : 1,
      boxShadow: rolling
        ? hardShadow(morkBorgColors.pink, 3)
        : hardShadow(morkBorgColors.yellow),
      '& .draft-die-icon': {
        opacity: 1,
        animation: rolling ? `${diceKick} 380ms cubic-bezier(0.22, 1, 0.36, 1) infinite` : 'none',
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& .draft-die-icon': {
        animation: 'none',
      },
    },
  }),
  content: {
    position: 'relative' as const,
    color: morkBorgColors.white,
  },
};

// ── ClassGate ────────────────────────────────────────────────────────────────
export const classGateStyles = {
  root: {
    display: 'grid',
    gap: { xs: 2, md: 3 },
    py: { xs: 2, md: 3 },
  },
  intro: {
    position: 'relative' as const,
    overflow: 'hidden',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: brutalBorder,
    boxShadow: { xs: hardShadow(morkBorgColors.pink, 5), md: hardShadow(morkBorgColors.pink, 8) },
    p: { xs: 2.25, sm: 3, md: 3.5 },
    transform: { lg: 'rotate(-0.35deg)' },
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      right: { xs: -52, sm: -18 },
      top: { xs: -18, sm: 18 },
      width: { xs: 128, sm: 174 },
      height: { xs: 42, sm: 56 },
      bgcolor: morkBorgColors.yellow,
      border: brutalBorder,
      transform: 'rotate(8deg)',
    },
  },
  kicker: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'inline-block',
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black),
    fontFamily: fonts.label,
    fontSize: '0.72rem',
    letterSpacing: '0.16em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    px: 1.25,
    py: 0.75,
    mb: 2,
    transform: 'rotate(0.8deg)',
  },
  title: {
    position: 'relative' as const,
    zIndex: 1,
    color: morkBorgColors.pink,
    fontFamily: fonts.accent,
    fontSize: { xs: '3rem', sm: '4.3rem', md: '5.2rem' },
    fontWeight: 400,
    lineHeight: 0.82,
    textTransform: 'uppercase' as const,
    textWrap: 'balance' as const,
    maxWidth: 720,
    mb: 1.5,
  },
  hint: {
    position: 'relative' as const,
    zIndex: 1,
    color: morkBorgColors.white,
    fontFamily: fonts.body,
    fontSize: { xs: '1.02rem', sm: '1.18rem' },
    lineHeight: 1.5,
    maxWidth: 620,
    textWrap: 'pretty' as const,
  },
  chooser: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(200px, 0.28fr)' },
    gap: { xs: 1.5, md: 2 },
    alignItems: 'stretch',
    maxWidth: '100vw',
    overflowX: 'hidden' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(auto-fit, minmax(240px, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
    },
    gap: { xs: 1.25, md: 1.5 },
    maxWidth: '100%',
  },
  card: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    textAlign: 'left' as const,
    gap: 0.85,
    p: { xs: 2, sm: 2.25 },
    minHeight: { xs: 156, sm: 184 },
    height: '100%',
    width: '100%',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: brutalBorder,
    borderRadius: 0,
    boxShadow: hardShadow(morkBorgColors.black, 5),
    transition:
      'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
    '&:hover': {
      bgcolor: morkBorgColors.grey,
      transform: 'translate(-2px, -2px)',
      boxShadow: hardShadow(morkBorgColors.pink, 7),
    },
    '&:active': {
      transform: 'translate(0, 0)',
      boxShadow: hardShadow(morkBorgColors.black, 2),
    },
    '&.Mui-focusVisible': {
      outline: `3px solid ${morkBorgColors.yellow}`,
      outlineOffset: '3px',
    },
    '&.Mui-disabled': {
      opacity: 0.55,
      filter: 'saturate(0.45)',
    },
  },
  cardTitle: {
    color: morkBorgColors.yellow,
    fontFamily: fonts.medieval,
    fontSize: { xs: '1.45rem', sm: '1.45rem' },
    lineHeight: 0.95,
    letterSpacing: '0.01em',
    textTransform: 'uppercase' as const,
    textWrap: 'pretty' as const,
    wordBreak: 'break-word' as const,
    hyphens: 'auto' as const,
  },
  cardDescription: {
    color: morkBorgColors.white,
    fontFamily: fonts.body,
    fontSize: '0.98rem',
    lineHeight: 1.32,
    textWrap: 'pretty' as const,
    textJustify: 'auto'
  },
  actions: {
    display: 'grid',
    gap: { xs: 1.25, md: 1.5 },
  },
  specialCard: {
    minHeight: { xs: 132, md: 174 },
    height: '100%',
    color: morkBorgColors.black,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black, 5),
    '&:hover': {
      color: morkBorgColors.black,
      transform: 'translate(-2px, -2px)',
      boxShadow: hardShadow(morkBorgColors.black, 7),
    },
  },
  special: {
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    '&:hover': { bgcolor: morkBorgColors.white },
  },
  random: {
    bgcolor: morkBorgColors.pink,
    color: morkBorgColors.black,
    '&:hover': { bgcolor: morkBorgColors.yellow },
  },
  randomMark: {
    display: 'inline-grid',
    placeItems: 'center',
    width: { xs: 48, sm: 58 },
    height: { xs: 44, sm: 54 },
    bgcolor: morkBorgColors.yellow,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black),
    transform: 'rotate(-5deg)',
    '& img': {
      display: 'block',
      width: { xs: 32, sm: 40 },
      height: { xs: 30, sm: 38 },
      objectFit: 'contain',
    },
  },
  specialTitle: {
    color: morkBorgColors.black,
    fontFamily: fonts.display,
    fontSize: { xs: '1.85rem', md: '2.15rem' },
    letterSpacing: '0.04em',
    lineHeight: 0.95,
    textTransform: 'uppercase' as const,
  },
  specialDescription: {
    color: 'rgba(10, 10, 10, 0.82)',
    fontFamily: fonts.body,
    fontSize: '0.98rem',
    lineHeight: 1.35,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    py: 5,
    color: morkBorgColors.black,
  },
};

// ── CharacterCreatePage ──────────────────────────────────────────────────────
export const createPageStyles = {
  page: {
    display: 'grid',
    gap: { xs: 2, md: 3 },
    pb: { xs: 12, md: 14 },
  },
  alert: {
    mt: 2,
    borderRadius: 0,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black),
    fontFamily: fonts.label,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  replaceNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    bgcolor: morkBorgColors.pink,
    color: morkBorgColors.black,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black),
    px: { xs: 1.75, sm: 2.25 },
    py: { xs: 1.25, sm: 1.5 },
  },
  replaceNoticeIcon: {
    fontSize: '1.4rem',
    lineHeight: 1,
  },
  replaceNoticeText: {
    fontFamily: fonts.label,
    fontSize: { xs: '0.86rem', sm: '0.95rem' },
    letterSpacing: '0.04em',
    lineHeight: 1.35,
    textTransform: 'uppercase' as const,
  },
  loadingPanel: {
    display: 'grid',
    placeItems: 'center',
    minHeight: 260,
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.yellow,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.pink, 6),
    my: 3,
  },
  sheetHeader: {
    position: 'relative' as const,
    overflow: 'hidden',
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black, 4),
    p: { xs: 2.25, sm: 3 },
    mt: { xs: 2, md: 3 },
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      right: { xs: -40, sm: 24 },
      bottom: { xs: -22, sm: -14 },
      width: { xs: 142, sm: 220 },
      height: { xs: 44, sm: 58 },
      bgcolor: morkBorgColors.black,
      border: brutalBorder,
      transform: 'rotate(-4deg)',
    },
  },
  sheetKicker: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'inline-block',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.yellow),
    fontFamily: fonts.label,
    fontSize: '0.68rem',
    letterSpacing: '0.16em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    px: 1,
    py: 0.65,
    mb: 1.5,
  },
  sheetTitle: {
    position: 'relative' as const,
    zIndex: 1,
    color: morkBorgColors.black,
    fontFamily: fonts.accent,
    fontSize: { xs: '2.8rem', sm: '3.7rem' },
    lineHeight: 0.85,
    textTransform: 'uppercase' as const,
    textWrap: 'balance' as const,
    mb: 1,
  },
  sheetMeta: {
    position: 'relative' as const,
    zIndex: 1,
    color: 'rgba(0, 0, 0, 0.8)',
    fontFamily: fonts.body,
    fontSize: { xs: '1rem', sm: '1.12rem' },
    lineHeight: 1.45,
    maxWidth: 620,
  },
};

// ── CreateSummaryBar (sticky confirm bar) ────────────────────────────────────
export const summaryBarStyles = {
  root: {
    position: 'sticky' as const,
    bottom: { xs: 8, sm: 12 },
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' } as const,
    alignItems: { xs: 'stretch', sm: 'center' },
    justifyContent: 'space-between',
    gap: { xs: 1.25, sm: 2 },
    p: { xs: 1.5, sm: 2 },
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.black, 4),
    zIndex: 3,
  },
  meta: {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' } as const,
    alignItems: { xs: 'flex-start', sm: 'center' },
    gap: { xs: 0.75, sm: 1.25 },
  },
  classChip: {
    display: 'inline-block',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    border: `2px solid ${morkBorgColors.black}`,
    fontFamily: fonts.label,
    fontSize: '0.72rem',
    letterSpacing: '0.14em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    px: 1,
    py: 0.65,
  },
  restart: {
    alignSelf: { xs: 'flex-start', sm: 'center' },
    color: morkBorgColors.black,
    borderRadius: 0,
    fontFamily: fonts.label,
    fontSize: '0.68rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    borderBottom: `2px solid ${morkBorgColors.black}`,
    px: 0,
    minWidth: 0,
    opacity: 0.8,
    '&:hover': {
      color: morkBorgColors.black,
      borderBottomColor: morkBorgColors.white,
      bgcolor: 'transparent',
      opacity: 1,
    },
  },
  status: {
    display: 'inline-block',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.pink,
    border: `2px solid ${morkBorgColors.black}`,
    fontFamily: fonts.label,
    fontSize: '0.68rem',
    letterSpacing: '0.12em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    px: 1,
    py: 0.65,
  },
  confirm: {
    minHeight: 52,
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.white,
    borderRadius: 0,
    border: brutalBorder,
    boxShadow: hardShadow(morkBorgColors.yellow),
    fontFamily: fonts.display,
    fontSize: '1.25rem',
    letterSpacing: '0.05em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
    px: 3,
    py: 1.2,
    transition:
      'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
    '&:hover': {
      bgcolor: morkBorgColors.black,
      color: morkBorgColors.yellow,
      transform: 'translate(-2px, -2px)',
      boxShadow: hardShadow(morkBorgColors.black, 6),
    },
    '&:active': {
      transform: 'translate(0, 0)',
      boxShadow: hardShadow(morkBorgColors.black, 2),
    },
    '&.Mui-disabled': {
      bgcolor: morkBorgColors.darkGrey,
      color: morkBorgColors.white,
      boxShadow: 'none',
      opacity: 0.7,
    },
  },
};
