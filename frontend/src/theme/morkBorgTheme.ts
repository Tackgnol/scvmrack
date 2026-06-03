import { createTheme } from '@mui/material/styles';
import type { MorkBorgColors, StatColorMap } from '@/types';

// Mork Borg color palette
export const morkBorgColors: MorkBorgColors = {
  yellow: '#FFE900',
  pink: '#FF3EB5',
  black: '#0a0a0a',
  white: '#f5f5f5',
  grey: '#1a1a1a',
  darkGrey: '#2a2a2a',
};

// Stat chip colors
export const statColors: StatColorMap = {
  agi: '#2d5a27',
  pre: '#5a2754',
  str: '#5a3d27',
  tou: '#27455a',
  def: morkBorgColors.pink,
  hp: '#8b0000',
  atk: '#5a1a1a',
  dmg: '#1a1a5a',
  all: morkBorgColors.yellow,
};

// Shared section stamp heading style
const sectionStamp = {
  color: morkBorgColors.black,
  backgroundColor: morkBorgColors.yellow,
  border: `3px solid ${morkBorgColors.black}`,
  boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
  px: 1.25,
  py: 0.25,
  display: 'inline-block',
  userSelect: 'none' as const,
  WebkitTapHighlightColor: 'transparent',
} as const;

// Custom reusable styles
export const customStyles = {
  // Navigation styles
  navLink: {
    base: {
      minWidth: 86,
      minHeight: 42,
      paddingInline: 14,
      cursor: 'pointer',
      transition:
        'box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
      bgcolor: morkBorgColors.black,
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"MedievalSharp", serif',
      fontSize: '1.02rem',
      lineHeight: 1,
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
    },
    active: {
      border: `3px solid ${morkBorgColors.yellow}`,
      boxShadow: `3px 3px 0 ${morkBorgColors.pink}`,
      transform: 'rotate(-0.8deg)',
      color: morkBorgColors.yellow,
    },
    inactive: {
      border: `3px solid ${morkBorgColors.grey}`,
      boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
      transform: 'rotate(0.45deg)',
      color: morkBorgColors.white,
    },
    hover: {
      transform: 'translate(-2px, -2px) rotate(-0.8deg)',
      boxShadow: `4px 4px 0 ${morkBorgColors.yellow}`,
      color: morkBorgColors.pink,
    },
  },

  // Modal styles
  modal: {
    paper: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: morkBorgColors.black,
      border: `3px solid ${morkBorgColors.yellow}`,
      outline: 'none',
      borderRadius: 0,
      p: 3,
    },
    header: {
      color: morkBorgColors.yellow,
      borderBottom: `2px solid ${morkBorgColors.pink}`,
      pb: 1,
      mb: 2,
      textTransform: 'uppercase' as const,
      fontWeight: 'bold',
      fontFamily: "'Bebas Neue', sans-serif",
    },
    input: {
      '& .MuiOutlinedInput-root': {
        color: morkBorgColors.white,
        borderRadius: 0,
        '& fieldset': { borderColor: '#444' },
        '&:hover fieldset': { borderColor: morkBorgColors.white },
        '&.Mui-focused fieldset': { borderColor: morkBorgColors.yellow },
      },
      '& .MuiInputLabel-root': { color: '#888' },
      '& .MuiInputLabel-root.Mui-focused': { color: morkBorgColors.yellow },
    },
  },

  // Menu styles
  menu: {
    paper: {
      bgcolor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.pink}`,
      borderRadius: 0,
      minWidth: 250,
      boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
    },
    item: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
      py: 1.25,
      px: 2,
      transition: 'all 0.15s ease',
      borderLeft: '3px solid transparent',
      '&:hover': {
        bgcolor: 'rgba(255, 62, 181, 0.1)',
        borderLeftColor: morkBorgColors.pink,
      },
    },
  },

  // Button variants
  buttons: {
    counter: {
      minWidth: 40,
      height: 40,
      bgcolor: '#222',
      border: `1px solid ${morkBorgColors.yellow}`,
      color: morkBorgColors.yellow,
      fontSize: '1.5rem',
      borderRadius: 0,
      '&:hover': {
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
      },
    },
    action: {
      px: 2,
      py: 0.5,
      border: `1px solid ${morkBorgColors.yellow}`,
      color: morkBorgColors.yellow,
      fontSize: '0.7rem',
      borderRadius: 0,
      '&:hover': {
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
      },
    },
    equip: {
      bgcolor: morkBorgColors.white,
      color: morkBorgColors.black,
      fontWeight: 'bold',
      borderRadius: 0,
      mb: 1,
      '&:hover': { bgcolor: morkBorgColors.pink },
    },
    save: {
      bgcolor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      fontWeight: 'bold',
      borderRadius: 0,
      '&:hover': { bgcolor: morkBorgColors.white },
    },
  },

  // Badge styles
  quantityBadge: {
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    fontFamily: "'Bebas Neue', sans-serif",
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: `2px solid ${morkBorgColors.black}`,
    fontWeight: 'bold',
    mt: 0.5,
    flexShrink: 0,
  },

  // Paper/Card variants
  paper: {
    section: {
      p: 2.5,
      mb: 2.5,
      bgcolor: morkBorgColors.black,
      border: `1px solid ${morkBorgColors.grey}`,
      borderRadius: 0,
    },
    itemRow: {
      bgcolor: '#111',
      border: `1px solid ${morkBorgColors.grey}`,
      borderRadius: 0,
      overflow: 'hidden',
    },
  },

  // Drawer styles
  drawer: {
    paper: {
      bgcolor: morkBorgColors.black,
      color: morkBorgColors.white,
      borderLeft: `5px solid ${morkBorgColors.yellow}`,
      p: 3,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
    },
  },

  // Equipment card
  equipmentCard: {
    base: {
      position: 'relative' as const,
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      transition: 'all 0.2s cubic-bezier(0.25, 0, 0.2, 1)',
      border: '1px solid transparent',
      backgroundColor: '#111',
      overflow: 'visible',
    },
    hover: {
      backgroundColor: '#1a1a1a',
      borderColor: morkBorgColors.pink,
      boxShadow: `0 0 12px rgba(255, 62, 181, 0.3), inset 0 0 12px rgba(255, 62, 181, 0.05)`,
    },
  },

  // Flag button
  flagButton: {
    base: {
      width: 48,
      height: 36,
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      padding: 0,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    active: {
      border: `3px solid ${morkBorgColors.yellow}`,
      boxShadow: `4px 4px 0 ${morkBorgColors.pink}`,
      filter: 'contrast(1.2) saturate(1.3)',
    },
    inactive: {
      border: `3px solid ${morkBorgColors.grey}`,
      boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
      filter: 'contrast(0.9) saturate(0.8) brightness(0.85)',
    },
  },

  // Status chip
  statusChip: {
    common: {
      fontWeight: 'bold',
      fontFamily: '"MedievalSharp", serif',
      borderColor: morkBorgColors.yellow,
      color: morkBorgColors.yellow,
    },
  },

  // Text field variants
  textField: {
    standard: {
      '& .MuiInput-root': {
        color: morkBorgColors.white,
        '&:before': { borderBottomColor: '#504c4c' },
        '&:hover:not(.Mui-disabled):before': {
          borderBottomColor: morkBorgColors.yellow,
        },
        '&:after': { borderBottomColor: morkBorgColors.yellow },
      },
      '& .MuiInputLabel-root': {
        color: morkBorgColors.white,
        '&.Mui-focused': { color: morkBorgColors.yellow },
      },
    },
    standardYellow: {
      '& .MuiInput-root': {
        color: morkBorgColors.yellow,
        '&:before': { borderBottomColor: '#504c4c' },
        '&:hover:not(.Mui-disabled):before': {
          borderBottomColor: morkBorgColors.yellow,
        },
        '&:after': { borderBottomColor: morkBorgColors.yellow },
      },
      '& .MuiInputLabel-root': {
        color: morkBorgColors.white,
        '&.Mui-focused': { color: morkBorgColors.yellow },
      },
    },
  },

  // Action buttons (add, save, cancel)
  actionButtons: {
    add: {
      backgroundColor: morkBorgColors.pink,
      color: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      borderRadius: '4px',
      width: 32,
      height: 32,
      cursor: 'pointer',
      fontFamily: "'Caveat Brush', cursive",
      fontSize: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: morkBorgColors.yellow,
        transform: 'translate(-2px, -2px)',
        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
      },
      '&:active': {
        transform: 'translate(0, 0)',
        boxShadow: 'none',
      },
    },
    confirm: {
      backgroundColor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      borderRadius: '4px',
      width: 32,
      height: 32,
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      '&:hover': {
        transform: 'translate(-2px, -2px)',
        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
      },
      '&:active': {
        transform: 'translate(0, 0)',
        boxShadow: 'none',
      },
    },
    cancel: {
      backgroundColor: morkBorgColors.grey,
      color: morkBorgColors.white,
      border: `2px solid ${morkBorgColors.black}`,
      borderRadius: '4px',
      width: 32,
      height: 32,
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      '&:hover': {
        transform: 'translate(-2px, -2px)',
        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
      },
      '&:active': {
        transform: 'translate(0, 0)',
        boxShadow: 'none',
      },
    },
  },

  // Box containers
  containers: {
    bordered: {
      padding: '12px',
      border: `2px solid ${morkBorgColors.pink}`,
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    borderedGrey: {
      padding: '12px',
      border: `2px solid ${morkBorgColors.grey}`,
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    notes: {
      backgroundColor: morkBorgColors.yellow,
      padding: '20px',
      boxShadow: `6px 6px 0 ${morkBorgColors.black}`,
      transform: 'rotate(0.2deg)',
      marginBottom: '20px',
    },
  },

  // Notes section
  notes: {
    title: {
      ...sectionStamp,
      mb: 1.5,
      transform: 'rotate(0.3deg)',
    },
    input: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: morkBorgColors.black,
        border: `2px solid ${morkBorgColors.black}`,
        '& fieldset': { border: 'none' },
        '& textarea': {
          color: morkBorgColors.yellow,
          fontFamily: "'Alegreya', serif",
          fontStyle: 'italic' as const,
          fontSize: '0.9rem',
        },
        '& textarea::placeholder': {
          color: morkBorgColors.yellow,
          opacity: 0.35,
        },
      },
    },
  },

  // Resource input
  resourceInput: {
    width: { xs: 92, sm: 80 },
    '& .MuiOutlinedInput-root': {
      backgroundColor: morkBorgColors.yellow,
      '& input': {
        color: morkBorgColors.black,
        textAlign: 'center' as const,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: { xs: '1.45rem', sm: '1.3rem' },
        padding: { xs: '8px 6px', sm: '6px' },
      },
      '& fieldset': { border: 'none' },
    },
  },

  // Footer button
  footerButton: {
    backgroundColor: morkBorgColors.black,
    border: `2px solid ${morkBorgColors.black}`,
    color: morkBorgColors.yellow,
    fontFamily: "'Antonio', sans-serif",
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    px: 3,
    py: 0.75,
    boxShadow: `3px 3px 0 ${morkBorgColors.pink}`,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: morkBorgColors.pink,
      color: morkBorgColors.black,
      transform: 'translate(-1px, -1px)',
      boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
    },
  },

  // Kill button — blood-red, menacing
  killButton: {
    backgroundColor: '#8b0000',
    border: `2px solid ${morkBorgColors.black}`,
    color: morkBorgColors.yellow,
    fontFamily: "'Antonio', sans-serif",
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    px: 3,
    py: 0.75,
    boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: morkBorgColors.pink,
      color: morkBorgColors.black,
      transform: 'translate(-1px, -1px)',
      boxShadow: '4px 4px 0 #8b0000',
    },
  },

  // Character card (for list page)
  characterCard: {
    backgroundColor: morkBorgColors.black,
    border: `2px solid ${morkBorgColors.black}`,
    '&:hover': {
      borderColor: morkBorgColors.pink,
    },
  },

  // Page title
  pageTitle: {
    fontFamily: '"MedievalSharp", serif',
    color: morkBorgColors.black,
    textTransform: 'uppercase' as const,
  },

  // Alert variants
  alerts: {
    warning: {
      marginBottom: '24px',
      backgroundColor: 'black',
      border: `1px solid ${morkBorgColors.yellow}`,
    },
  },

  // Chip variants
  chips: {
    hp: {
      backgroundColor: morkBorgColors.pink,
      color: morkBorgColors.white,
      fontWeight: 'bold',
    },
  },

  // Ability card
  abilityCard: {
    container: {
      padding: '12px',
      backgroundColor: '#0a0a0a',
      border: `2px solid ${morkBorgColors.grey}`,
      borderRadius: 0,
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: morkBorgColors.yellow,
        transform: 'translateY(-2px)',
      },
    },
    name: {
      color: morkBorgColors.yellow,
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.1rem',
      textTransform: 'uppercase' as const,
      marginBottom: '4px',
    },
    value: {
      color: morkBorgColors.white,
      fontSize: '2rem',
      fontWeight: 'bold',
      fontFamily: "'Bebas Neue', sans-serif",
    },
    modifier: {
      color: morkBorgColors.pink,
      fontSize: '1.2rem',
      marginLeft: '8px',
    },
  },

  // Summary bar
  summaryBar: {
    container: {
      display: 'flex',
      gap: '8px',
      padding: '12px',
      backgroundColor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.yellow}`,
      marginBottom: '12px',
      flexWrap: 'wrap' as const,
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      backgroundColor: '#111',
      border: `1px solid ${morkBorgColors.grey}`,
    },
    label: {
      fontSize: '0.7rem',
      color: morkBorgColors.grey,
      textTransform: 'uppercase' as const,
    },
    value: {
      fontSize: '1.1rem',
      color: morkBorgColors.yellow,
      fontWeight: 'bold',
      fontFamily: "'Bebas Neue', sans-serif",
    },
  },

  // Character name input
  characterNameInput: {
    '& .MuiOutlinedInput-root': {
      '& input': {
        color: morkBorgColors.yellow,
        fontFamily: "'MedievalSharp', serif",
        fontSize: '1.8rem',
        padding: '12px',
        textAlign: 'center' as const,
      },
      '& fieldset': {
        borderColor: morkBorgColors.yellow,
        borderWidth: '2px',
      },
      '&:hover fieldset': {
        borderColor: morkBorgColors.pink,
      },
      '&.Mui-focused fieldset': {
        borderColor: morkBorgColors.pink,
      },
    },
  },

  // Class name input
  classNameInput: {
    '& .MuiOutlinedInput-root': {
      '& input': {
        color: morkBorgColors.white,
        fontSize: '1rem',
        padding: '8px',
        textAlign: 'center' as const,
      },
      '& fieldset': {
        borderColor: morkBorgColors.grey,
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: morkBorgColors.yellow,
      },
      '&.Mui-focused fieldset': {
        borderColor: morkBorgColors.yellow,
      },
    },
  },

  // Ability adjust button
  abilityAdjustButton: {
    width: { xs: 44, sm: 28 },
    height: { xs: 44, sm: 28 },
    minWidth: { xs: 44, sm: 28 },
    backgroundColor: 'transparent',
    border: `2px solid ${morkBorgColors.yellow}`,
    color: morkBorgColors.yellow,
    transition: 'all 0.15s ease',
    borderRadius: 0,
    '&:hover': {
      backgroundColor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      transform: 'scale(1.1)',
    },
  },

  // Ability value input
  abilityValueInput: {
    width: { xs: 56, sm: 48 },
    '& .MuiOutlinedInput-root': {
      backgroundColor: morkBorgColors.yellow,
      '& input': {
        color: morkBorgColors.black,
        textAlign: 'center' as const,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: { xs: '1.65rem', sm: '1.8rem' },
        padding: { xs: '6px 4px', sm: '2px 4px' },
        lineHeight: 1,
      },
      '& fieldset': { border: 'none' },
    },
  },

  // Summary bar HP input
  hpInput: {
    width: { xs: 56, sm: 45 },
    '& .MuiOutlinedInput-root': {
      bgcolor: 'secondary.main',
      '& input': {
        color: morkBorgColors.black,
        textAlign: 'center' as const,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: { xs: '1.45rem', sm: '1.4rem' },
        p: { xs: 1, sm: 0.5 },
      },
    },
  },

  // Summary bar HP divider
  hpDivider: {
    color: morkBorgColors.white,
    fontFamily: "'Bebas Neue'",
  },

  // ResourceRow styles
  resourceRow: {
    container: {
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
      gap: 1.25,
      mb: 1.5,
    },
    paper: {
      p: 1.5,
      textAlign: 'center' as const,
      flexDirection: 'column',
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${morkBorgColors.black}`,
      boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.45)',
    },
    label: {
      mb: 0.75,
      fontSize: { xs: '0.75rem', sm: '0.6rem' },
      letterSpacing: { xs: '0.08em', sm: '0.04em' },
    },
  },

  // Zone divider — decorative break between section groups
  zoneDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    my: { xs: 3, sm: 4 },
    '&::before, &::after': {
      content: '""',
      flex: 1,
      height: '2px',
      bgcolor: morkBorgColors.black,
      opacity: 0.12,
    },
  },
  zoneDividerIcon: {
    color: morkBorgColors.pink,
    fontSize: '0.7rem',
    opacity: 0.5,
    userSelect: 'none' as const,
  },

  // Footer styles
  footer: {
    paper: {
      textAlign: 'center' as const,
      p: { xs: 2, sm: 2.5 },
      bgcolor: 'transparent',
      boxShadow: 'none',
      borderTop: `1px solid rgba(10, 10, 10, 0.15)`,
      mt: 3,
    },
    title: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.6rem',
      letterSpacing: '0.35em',
      textTransform: 'uppercase' as const,
      color: morkBorgColors.black,
      opacity: 0.3,
    },
    buttonContainer: {
      display: 'flex',
      gap: 2,
      justifyContent: 'center',
      mt: 1.5,
    },
  },

  // Abilities styles
  abilities: {
    container: {
      mb: 1.5,
    },
    title: {
      ...sectionStamp,
      mb: 1.5,
      transform: 'rotate(-0.6deg)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
      gap: { xs: 0.75, sm: 1.25 },
    },
  },

  // ItemAutocomplete styles
  itemAutocomplete: {
    itemName: {
      color: morkBorgColors.yellow,
      fontWeight: 'bold',
    },
    itemType: {
      fontSize: '0.65rem',
      color: '#888',
    },
  },

  // SummaryBar HP container
  hpContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.5,
  },

  // SummaryStat label
  summaryStatLabel: {
    mb: 0.5,
  },

  // FlagContainer styles
  flagContainer: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
  },

  // Layout styles
  layout: {
    root: {
      bgcolor: morkBorgColors.yellow,
      minHeight: '100vh',
      py: 2,
    },
  },

  // SnackbarProvider Alert — styled to match Mörk Borg aesthetic
  snackbarAlert: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 0,
    fontFamily: "'Antonio', sans-serif",
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    border: `2px solid ${morkBorgColors.black}`,
    boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
    '&.MuiAlert-filled': {
      // Keep filled variant but override colors per severity below
    },
    '&.MuiAlert-filledError': {
      backgroundColor: '#8b0000',
      color: morkBorgColors.yellow,
    },
    '&.MuiAlert-filledSuccess': {
      backgroundColor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      '& .MuiAlert-icon': { color: morkBorgColors.black },
    },
    '&.MuiAlert-filledInfo': {
      backgroundColor: morkBorgColors.black,
      color: morkBorgColors.white,
      border: `2px solid ${morkBorgColors.yellow}`,
    },
    '&.MuiAlert-filledWarning': {
      backgroundColor: morkBorgColors.pink,
      color: morkBorgColors.black,
      '& .MuiAlert-icon': { color: morkBorgColors.black },
    },
  },

  // AuthModal error alert
  authErrorAlert: {
    mt: 2,
  },

  // AuthModal divider text
  authDividerText: {
    color: 'text.secondary',
  },

  // Header bone icon gap
  boneIconGap: (isOpen: boolean) => ({
    gap: isOpen ? '0px' : '6px',
  }),

  // Summary bar max HP box
  maxHpBox: {
    width: 45,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${morkBorgColors.pink}`,
    borderRadius: 1,
  },

  // Summary bar max HP text
  maxHpText: {
    color: morkBorgColors.pink,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.2rem',
  },

  // Summary bar paper
  summaryBarPaper: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, 1fr)',
      sm: 'repeat(4, 1fr)',
    },
    mb: 2.5,
    position: 'relative' as const,
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 6,
      bgcolor: 'secondary.main',
    },
  },

  // Summary stat container
  summaryStat: {
    p: 2,
    textAlign: 'center' as const,
    borderRight: `1px solid ${morkBorgColors.grey}`,
    '&:last-child': { borderRight: 'none' },
  },

  // Character name box — hot pink card with black shadow
  characterNameBox: {
    position: 'relative' as const,
    zIndex: 1,
    bgcolor: morkBorgColors.pink,
    border: `3px solid ${morkBorgColors.black}`,
    boxShadow: `6px 6px 0 ${morkBorgColors.black}`,
    p: { xs: 2, sm: 3 },
    pt: { xs: 1.5, sm: 1.5 },
    pb: { xs: 2, sm: 2.5 },
    mr: { xs: 0, sm: -4 },
    pr: { xs: 2, sm: 5 },
    transform: 'rotate(-0.3deg)',
  },

  // Character name label — small stamp label
  characterNameLabel: {
    fontFamily: "'Antonio', sans-serif",
    fontSize: '0.6rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: morkBorgColors.black,
    opacity: 0.45,
    mb: 0.25,
  },

  // Character name text — BIG Black Ops One
  characterNameText: {
    fontFamily: "'Black Ops One', cursive",
    fontSize: 'clamp(2.4rem, 8vw, 4.5rem)',
    color: morkBorgColors.black,
    lineHeight: 0.9,
    letterSpacing: '-0.02em',
    pb: 1,
    borderBottom: `3px solid ${morkBorgColors.black}`,
    mb: 1,
  },

  // Character trait text — the flavor line beneath the name
  characterTraitText: {
    fontFamily: "'Alegreya', serif",
    fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
    fontStyle: 'italic' as const,
    color: morkBorgColors.black,
    opacity: 0.6,
  },

  // Character class paper — overlaps ON TOP of the name card
  characterClassPaper: {
    position: 'relative' as const,
    p: { xs: 2, sm: 2.5 },
    bgcolor: morkBorgColors.black,
    border: `3px solid ${morkBorgColors.pink}`,
    boxShadow: `8px 8px 0 ${morkBorgColors.pink}`,
    transform: { xs: 'rotate(0.4deg)', sm: 'rotate(1.2deg)' },
    zIndex: 3,
    mb: { xs: 0, sm: -2 },
    ml: { xs: 0, sm: -5 },
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: { xs: 'rotate(0.4deg)', sm: 'rotate(0deg) translateY(-2px)' },
      boxShadow: `10px 12px 0 ${morkBorgColors.pink}`,
    },
  },

  // Character class label
  characterClassLabel: {
    mb: 0.25,
    fontSize: '0.5rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    opacity: 0.5,
  },

  // Character class text
  characterClassText: {
    fontFamily: "'Caveat Brush', cursive",
    fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
    color: morkBorgColors.yellow,
    minHeight: '1.8rem',
    lineHeight: 1.1,
  },

  // Character class description
  characterClassDescription: {
    mt: 1,
    color: morkBorgColors.white,
    opacity: 0.5,
    fontFamily: "'Alegreya', serif",
    fontStyle: 'italic' as const,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    borderTop: `1px solid rgba(255,255,255,0.08)`,
    pt: 1,
  },

  // Character name/class grid — name card tucks under class card
  characterNameClassGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1.6fr 1fr' },
    gap: { xs: 1, sm: 0 },
    mb: 3,
    alignItems: 'end',
  },

  // Auth modal styles
  authModal: {
    closeButton: {
      position: 'absolute' as const,
      top: 8,
      right: 8,
    },
    title: {
      mb: 2,
      color: morkBorgColors.yellow,
    },
    titleCenter: {
      mb: 2,
      color: morkBorgColors.yellow,
      textAlign: 'center' as const,
    },
    textField: {
      mb: 2,
    },
    textFieldLast: {
      mb: 3,
    },
    divider: {
      my: 3,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    magicLinkButton: {
      color: morkBorgColors.pink,
    },
    errorAlert: {
      mt: 2,
      bgcolor: 'black',
      color: '#ff0000',
      border: `1px solid ${morkBorgColors.pink}`,
    },
    infoAlert: {
      mb: 2,
    },
    warningAlert: {
      mb: 2,
    },
    centeredBox: {
      textAlign: 'center' as const,
      py: 2,
    },
    titleMargin: {
      mb: 1,
    },
    titleMarginLarge: {
      mb: 3,
    },
    sectionDivider: {
      my: 2,
    },
    buttonGap: {
      display: 'flex',
      gap: 2,
    },
    formSection: {
      mb: 2,
    },
    textCenter: {
      mb: 2,
      textAlign: 'center' as const,
    },
  },

  // Equipment section styles
  equipmentSection: {
    container: {
      mb: 2.5,
    },
    sectionTitle: {
      ...sectionStamp,
      mb: 1.5,
      transform: 'rotate(-0.6deg)',
    },
    gearGrid: {
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
      gap: 1.25,
    },
    addItemsSection: {
      mt: 6,
    },
    addItemsDivider: {
      borderColor: morkBorgColors.pink,
      mb: 2,
      opacity: 0.5,
    },
    addItemsTitle: {
      color: morkBorgColors.yellow,
      textTransform: 'uppercase' as const,
      fontWeight: 'bold',
      mb: 2,
    },
    dialogPaper: {
      bgcolor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.pink}`,
      borderRadius: 0,
    },
    dialogTitle: {
      color: morkBorgColors.yellow,
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid #333',
    },
    dialogContent: {
      mt: 2,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
    },
    dialogActions: {
      p: 2,
      borderTop: '1px solid #333',
    },
    cancelButton: {
      color: '#888',
    },
    saveButton: {
      bgcolor: morkBorgColors.pink,
      color: 'black',
      fontWeight: 'bold',
      '&:hover': { bgcolor: morkBorgColors.white },
    },
  },

  // Gear slot styles
  gearSlot: {
    base: {
      bgcolor: morkBorgColors.white,
      borderLeft: `5px solid ${morkBorgColors.pink}`,
      p: 1.5,
      position: 'relative' as const,
      cursor: 'pointer',
      minHeight: '86px',
      transition: 'transform 0.1s',
      '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: `0 0 10px ${morkBorgColors.pink}`,
      },
    },
    label: {
      position: 'absolute' as const,
      top: 5,
      right: 10,
      color: morkBorgColors.pink,
      fontSize: '0.65rem',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
    },
    nameEmpty: {
      color: morkBorgColors.black,
      fontSize: '1rem',
      mt: 1.5,
      fontFamily: 'inherit',
      fontWeight: 'normal',
      opacity: 0.5,
    },
    nameFilled: {
      color: morkBorgColors.black,
      fontSize: '1rem',
      mt: 1.5,
      fontFamily: 'inherit',
      fontWeight: 'bold',
      opacity: 1,
    },
    detail: {
      color: '#444',
      fontSize: '0.8rem',
      fontStyle: 'italic' as const,
      mt: 0.5,
      borderTop: '1px dashed #ccc',
      pt: 0.5,
    },
  },

  // Equipment modal input
  equipmentModalInput: {
    '& .MuiInputLabel-root': { color: '#888' },
    '& .MuiInputLabel-root.Mui-focused': { color: morkBorgColors.pink },
    '& .MuiOutlinedInput-root': {
      color: morkBorgColors.white,
      '& fieldset': { borderColor: '#444' },
      '&:hover fieldset': { borderColor: morkBorgColors.white },
      '&.Mui-focused fieldset': { borderColor: morkBorgColors.pink },
    },
  },

  // Loading states
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    p: 4,
  },
  loadingSpinner: {
    color: morkBorgColors.yellow,
  },

  // Empty/error states
  emptyStatePaper: {
    p: 2.5,
    mb: 2.5,
    textAlign: 'center' as const,
  },

  // Header styles
  header: {
    paper: {
      p: { xs: 1.5, sm: 2.5 },
      mb: 2.5,
      transform: 'rotate(-0.5deg)',
      position: 'relative' as const,
      '&::after': {
        content: '""',
        position: 'absolute' as const,
        bottom: -8,
        left: 20,
        right: 20,
        height: 8,
        bgcolor: 'secondary.main',
      },
    },
    container: (isMobile: boolean) => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      minHeight: isMobile ? 'auto' : '160px',
    }),
    titleBox: {
      flex: 1,
    },
    titleRow: (isMobile: boolean) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? 0.75 : 1.25,
      flexWrap: 'wrap' as const,
    }),
    title: (isMobile: boolean) => ({
      color: morkBorgColors.yellow,
      fontSize: isMobile ? '1.9rem' : 'clamp(3.5rem, 8vw, 5rem)',
      lineHeight: 0.85,
      '& span': { color: morkBorgColors.pink },
    }),
    alphaBadge: (isMobile: boolean) => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      mt: isMobile ? 0.05 : 0.35,
      px: isMobile ? 0.65 : 0.85,
      py: isMobile ? 0.25 : 0.35,
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.yellow}`,
      boxShadow: `3px 3px 0 ${morkBorgColors.yellow}`,
      fontFamily: "'Antonio', sans-serif",
      fontSize: isMobile ? '0.6rem' : '0.72rem',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0.16em',
      textTransform: 'uppercase' as const,
      transform: 'rotate(1.5deg)',
      whiteSpace: 'nowrap' as const,
    }),
    titleSecondLine: (isMobile: boolean) => ({
      fontFamily: "'Black Ops One', cursive",
      color: morkBorgColors.yellow,
      fontSize: isMobile ? '2rem' : 'clamp(3rem, 9vw, 4.8rem)',
      lineHeight: 0.9,
      letterSpacing: '0.05em',
      mt: 0.25,
    }),
    subtitle: (isMobile: boolean) => ({
      color: morkBorgColors.white,
      letterSpacing: isMobile ? '0.03em' : '0.08em',
      mt: 1,
      fontSize: isMobile ? '0.7rem' : '1rem',
    }),
    mobileMenuButton: {
      display: 'flex',
      alignItems: 'center',
    },
    desktopNav: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 1.5,
      minWidth: 0,
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      maxWidth: 'min(100%, 720px)',
      flexWrap: 'wrap' as const,
      justifyContent: 'flex-end',
    },
    printButton: {
      minHeight: 24,
      px: 1.25,
      py: 0.2,
      borderRadius: 0,
      backgroundColor: morkBorgColors.black,
      border: `1px solid ${morkBorgColors.yellow}`,
      color: morkBorgColors.yellow,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.58rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      lineHeight: 1,
      '&:hover': {
        backgroundColor: morkBorgColors.pink,
        color: morkBorgColors.black,
        borderColor: morkBorgColors.black,
      },
      '& .MuiButton-startIcon': {
        mr: 0.35,
        ml: 0,
      },
    },
    reportBugButton: {
      minHeight: 24,
      px: 1.25,
      py: 0.2,
      borderRadius: 0,
      backgroundColor: morkBorgColors.black,
      border: `1px solid ${morkBorgColors.pink}`,
      color: morkBorgColors.yellow,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.58rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      lineHeight: 1,
      '&:hover': {
        backgroundColor: morkBorgColors.pink,
        color: morkBorgColors.black,
        borderColor: morkBorgColors.black,
      },
      '& .MuiButton-startIcon': {
        mr: 0.35,
        ml: 0,
      },
    },
    navBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 0.75,
      flexWrap: 'wrap' as const,
      maxWidth: 560,
    },
    authButton: {
      color: morkBorgColors.white,
      border: `1px solid ${morkBorgColors.white}`,
    },
    drawerPaper: {
      width: '85%',
      maxWidth: '320px',
    },
    drawerHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    drawerTitle: {
      color: morkBorgColors.pink,
      fontFamily: '"MedievalSharp", serif',
    },
    drawerNav: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 3,
      px: 1,
    },
    drawerFooter: {
      mt: 'auto',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
      pb: 4,
    },
    drawerStatusBox: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 1,
      flexWrap: 'wrap' as const,
    },
    drawerPrintButton: {
      minHeight: 32,
      px: 1.25,
      borderRadius: 0,
      backgroundColor: morkBorgColors.black,
      border: `1px solid ${morkBorgColors.yellow}`,
      color: morkBorgColors.yellow,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      '&:hover': {
        backgroundColor: morkBorgColors.pink,
        color: morkBorgColors.black,
        borderColor: morkBorgColors.black,
      },
    },
    drawerReportBugButton: {
      minHeight: 32,
      px: 1.25,
      borderRadius: 0,
      backgroundColor: morkBorgColors.black,
      border: `1px solid ${morkBorgColors.pink}`,
      color: morkBorgColors.yellow,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.65rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      '&:hover': {
        backgroundColor: morkBorgColors.pink,
        color: morkBorgColors.black,
        borderColor: morkBorgColors.black,
      },
    },
    drawerAuthBox: {
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    drawerAuthButton: {
      color: morkBorgColors.yellow,
      border: `2px solid ${morkBorgColors.yellow}`,
      width: 50,
      height: 50,
    },
    syncIcon: {
      animation: 'spin 1s linear infinite',
    },
    savingChip: {
      fontWeight: 'bold',
      fontFamily: '"MedievalSharp", serif',
      borderColor: morkBorgColors.yellow,
      color: morkBorgColors.yellow,
      '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
    },
    validationChip: {
      maxWidth: { xs: '100%', md: 360 },
      bgcolor: morkBorgColors.black,
      borderColor: morkBorgColors.pink,
      color: morkBorgColors.yellow,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.58rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      '& .MuiChip-icon': {
        color: morkBorgColors.pink,
        fontSize: 16,
      },
      '& .MuiChip-label': {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
    keyframesSpin: {
      '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
    },
  },

  // Small component styles
  abilityCardTwo: {
    paper: (rotate: number) => ({
      p: { xs: 1.25, sm: 2 },
      textAlign: 'center' as const,
      transform: `rotate(${rotate}deg)`,
      position: 'relative' as const,
      overflow: 'visible' as const,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: `rotate(${rotate}deg) translateY(-2px)`,
        boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
      },
    }),
    label: {
      mb: 0.5,
      fontSize: '0.55rem',
      letterSpacing: '0.2em',
      textTransform: 'uppercase' as const,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
    },
    modifier: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
      color: morkBorgColors.pink,
      lineHeight: 1,
      mt: 0.5,
    },
    description: {
      mt: 0.25,
      opacity: 0.45,
      fontStyle: 'italic' as const,
      fontSize: '0.55rem',
      fontFamily: "'Alegreya', serif",
    },
  },

  // Mork Borg Modal styles
  morkBorgModal: {
    dialogPaper: {
      gap: 3,
      bgcolor: morkBorgColors.black,
      border: `4px solid ${morkBorgColors.yellow}`,
      boxShadow: `10px 10px 0 ${morkBorgColors.pink}`,
    },
    dialogTitle: {
      bgcolor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pr: 1,
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.6rem',
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
    },
    closeButton: {
      bgcolor: morkBorgColors.black,
      color: morkBorgColors.yellow,
      '&:hover': {
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
      },
    },
    dialogContent: {
      pt: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
    dialogActions: {
      p: 2,
      borderTop: `2px solid ${morkBorgColors.grey}`,
    },
  },

  // Feedback / bug report dialog styles
  feedbackDialog: {
    body: {
      display: 'grid',
      gap: 2.25,
    },
    description: {
      color: morkBorgColors.white,
      fontFamily: "'Alegreya', Georgia, serif",
      fontSize: { xs: '1rem', sm: '0.98rem' },
      lineHeight: 1.55,
      maxWidth: '66ch',
      textWrap: 'pretty' as const,
    },
    field: {
      '& .MuiInputLabel-root': {
        color: morkBorgColors.pink,
        fontFamily: "'Antonio', sans-serif",
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: morkBorgColors.yellow,
      },
      '& .MuiOutlinedInput-root': {
        bgcolor: morkBorgColors.grey,
        color: morkBorgColors.white,
        borderRadius: 0,
        '& fieldset': {
          borderColor: morkBorgColors.darkGrey,
          borderWidth: 2,
        },
        '&:hover fieldset': {
          borderColor: morkBorgColors.yellow,
        },
        '&.Mui-focused fieldset': {
          borderColor: morkBorgColors.pink,
        },
      },
      '& .MuiInputBase-input': {
        color: morkBorgColors.white,
        fontFamily: "'Alegreya', Georgia, serif",
        fontSize: '1rem',
        lineHeight: 1.5,
      },
    },
    actions: {
      flexDirection: { xs: 'column', sm: 'row' },
      gap: { xs: 1.25, sm: 1 },
      justifyContent: 'flex-end',
      alignItems: { xs: 'stretch', sm: 'center' },
      width: '100%',
      '& .MuiButton-root': {
        minHeight: 40,
      },
    },
  },

  // Modal button variants
  modalButton: {
    primary: {
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      '&:hover': { bgcolor: morkBorgColors.yellow },
      '&.Mui-disabled': {
        bgcolor: morkBorgColors.darkGrey,
        color: morkBorgColors.white,
        borderColor: morkBorgColors.grey,
        opacity: 0.62,
      },
    },
    secondary: {
      bgcolor: morkBorgColors.grey,
      color: morkBorgColors.white,
      border: `2px solid ${morkBorgColors.white}`,
      '&:hover': {
        bgcolor: morkBorgColors.white,
        color: morkBorgColors.black,
      },
      '&.Mui-disabled': {
        color: morkBorgColors.white,
        borderColor: morkBorgColors.darkGrey,
        opacity: 0.55,
      },
    },
    danger: {
      bgcolor: '#8b0000',
      color: morkBorgColors.white,
      border: `2px solid ${morkBorgColors.black}`,
      '&:hover': {
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
      },
      '&.Mui-disabled': {
        bgcolor: morkBorgColors.darkGrey,
        color: morkBorgColors.white,
        borderColor: morkBorgColors.grey,
        opacity: 0.62,
      },
    },
  },

  // FAQ page styles
  faqPage: {
    container: {
      py: 2,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3,
    },
    title: {
      fontFamily: '"MedievalSharp", serif',
      color: morkBorgColors.black,
      textTransform: 'uppercase' as const,
    },
    backButton: {
      borderColor: morkBorgColors.black,
      color: morkBorgColors.black,
      '&:hover': {
        bgcolor: morkBorgColors.black,
        color: morkBorgColors.yellow,
      },
    },
    accordion: {
      bgcolor: morkBorgColors.black,
      color: morkBorgColors.white,
      mb: 1,
      '&:before': { display: 'none' },
      border: `1px solid ${morkBorgColors.black}`,
      '&.Mui-expanded': {
        borderColor: morkBorgColors.pink,
      },
    },
    accordionSummary: {
      '&.Mui-expanded': {
        borderBottom: `1px solid ${morkBorgColors.pink}`,
      },
    },
    expandIcon: {
      color: morkBorgColors.yellow,
    },
    question: {
      fontWeight: 'bold',
      color: morkBorgColors.yellow,
    },
    answer: {
      color: morkBorgColors.white,
    },
    answerWithAction: {
      display: 'grid',
      gap: 1.5,
      alignItems: 'start',
    },
    reportBugButton: {
      justifySelf: 'flex-start',
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      borderRadius: 0,
      boxShadow: `3px 3px 0 ${morkBorgColors.yellow}`,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.7rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      '&:hover': {
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
        transform: 'translate(-1px, -1px)',
        boxShadow: `4px 4px 0 ${morkBorgColors.pink}`,
      },
      '&:active': {
        transform: 'translate(0, 0)',
        boxShadow: `2px 2px 0 ${morkBorgColors.yellow}`,
      },
    },
    footer: {
      mt: 4,
      textAlign: 'center' as const,
    },
    footerText: {
      color: morkBorgColors.black,
      opacity: 0.7,
      fontSize: '0.85rem',
    },
  },

  // Release page styles
  releasePage: {
    container: {
      py: 2,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3,
    },
    title: {
      fontFamily: '"MedievalSharp", serif',
      color: morkBorgColors.black,
      textTransform: 'uppercase' as const,
    },
    backButton: {
      borderColor: morkBorgColors.black,
      color: morkBorgColors.black,
      '&:hover': {
        bgcolor: morkBorgColors.black,
        color: morkBorgColors.yellow,
      },
    },
    cardsContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
    },
    card: {
      bgcolor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
    },
    versionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
    },
    versionInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    },
    versionNumber: {
      fontFamily: '"MedievalSharp", serif',
      color: morkBorgColors.yellow,
    },
    typeChip: (type: 'major' | 'minor' | 'patch', color: string) => ({
      bgcolor: color,
      color: type === 'patch' ? morkBorgColors.black : morkBorgColors.white,
      fontWeight: 'bold',
    }),
    date: {
      color: morkBorgColors.white,
      opacity: 0.6,
      fontSize: '0.9rem',
    },
    changesList: {
      m: 0,
      pl: 2.5,
    },
    changeItem: {
      color: morkBorgColors.white,
      mb: 0.5,
      '&::marker': {
        color: morkBorgColors.pink,
      },
    },
    footer: {
      mt: 4,
      textAlign: 'center' as const,
    },
    footerText: {
      color: morkBorgColors.black,
      opacity: 0.7,
      fontSize: '0.85rem',
    },
  },

  // Characters list page styles
  charactersListPage: {
    container: {
      py: 2,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3,
    },
    backButton: {
      borderColor: morkBorgColors.black,
      color: morkBorgColors.black,
      '&:hover': {
        bgcolor: morkBorgColors.black,
        color: morkBorgColors.yellow,
      },
    },
    loginButton: {
      bgcolor: morkBorgColors.pink,
      '&:hover': { bgcolor: morkBorgColors.yellow },
    },
    loadingBox: {
      display: 'flex',
      justifyContent: 'center',
      py: 4,
    },
    loadingSpinner: {
      color: morkBorgColors.black,
    },
    errorAlert: {
      mb: 2,
    },
    emptyState: {
      textAlign: 'center' as const,
      py: 4,
    },
    emptyStateText: {
      color: morkBorgColors.black,
      mb: 2,
    },
    createButton: {
      bgcolor: morkBorgColors.pink,
      '&:hover': { bgcolor: morkBorgColors.yellow },
    },
    cardContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    characterName: {
      fontFamily: '"MedievalSharp", serif',
      color: morkBorgColors.yellow,
      mb: 0.5,
    },
    characterClass: {
      color: morkBorgColors.white,
      fontSize: '0.9rem',
      opacity: 0.8,
    },
    statsBox: {
      textAlign: 'right' as const,
    },
    hpChip: {
      mb: 1,
    },
    updateDate: {
      color: morkBorgColors.white,
      fontSize: '0.75rem',
      opacity: 0.6,
    },
    guestWarning: {
      py: 4,
    },
  },

  // Equipped bar styles
  equippedBar: {
    container: {
      display: 'flex',
      flexDirection: { xs: 'column' as const, sm: 'row' as const },
      gap: 1.25,
      mb: 1.5,
    },
    icon: {
      fontSize: '1.5rem',
    },
    contentBox: {
      flex: 1,
      minWidth: 0,
    },
    typeLabel: {
      fontSize: '0.55rem',
      textTransform: 'uppercase' as const,
    },
    itemName: {
      color: morkBorgColors.white,
      fontSize: '1.1rem',
      mt: 0.25,
      fontWeight: 'bold',
    },
    itemDetail: {
      color: morkBorgColors.yellow,
      fontSize: '0.7rem',
    },
    action: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      marginLeft: 'auto',
      padding: '2px 6px',
      border: `1px solid ${morkBorgColors.grey}`,
      backgroundColor: '#111',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.12em',
    },
    actionLabel: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.55rem',
      color: morkBorgColors.yellow,
    },
    actionIcon: {
      fontSize: '1rem',
      color: morkBorgColors.yellow,
    },
    infoPeg: {
      flexShrink: 0,
      alignSelf: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 26,
      height: 26,
      borderRadius: '50%',
      bgcolor: morkBorgColors.white,
      color: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      userSelect: 'none' as const,
      WebkitTapHighlightColor: 'transparent',
      transition: 'transform 0.1s ease-out',
      '&:hover': {
        transform: 'scale(1.2)',
        bgcolor: morkBorgColors.yellow,
      },
      '&:active': {
        transform: 'scale(0.85)',
      },
    },
    ammoPeg: {
      position: 'absolute' as const,
      top: -12,
      right: -12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 42,
      height: 42,
      borderRadius: '50%',
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      zIndex: 1,
      transition: 'transform 0.1s ease-out, box-shadow 0.2s ease-out',
      '&:hover': {
        transform: 'scale(1.2)',
      },
      '&:active': {
        transform: 'scale(0.85)',
      },
    },
    ammoPegNormal: {
      bgcolor: morkBorgColors.yellow,
      color: morkBorgColors.black,
      border: `3px solid ${morkBorgColors.black}`,
      boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    },
    ammoPegEmpty: {
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      border: `3px solid ${morkBorgColors.black}`,
      boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
    },
    menuUnequipItem: {
      color: morkBorgColors.pink,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.75rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.15em',
    },
    menuDivider: {
      bgcolor: 'rgba(255, 62, 181, 0.2)',
    },
    menuItemName: {
      color: morkBorgColors.yellow,
      fontFamily: "'MedievalSharp', serif",
      fontSize: '1.05rem',
    },
    menuItemDescription: {
      color: morkBorgColors.pink,
      fontFamily: "'Alegreya', serif",
      fontStyle: 'italic' as const,
      fontSize: '0.8rem',
    },
  },

  // Character descriptors styles
  characterDescriptors: {
    paper: {
      p: 2.5,
      mb: 2.5,
    },
    paperWithRelative: {
      p: 2.5,
      position: 'relative' as const,
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 1,
    },
    buttonGroup: {
      display: 'flex',
      gap: 1,
    },
    newAbilityForm: {
      pb: 2,
      mb: 2,
      borderBottom: `2px solid ${morkBorgColors.yellow}`,
    },
    abilityNameField: {
      mb: 1,
    },
    abilitySeparator: {
      borderBottom: `1px solid ${morkBorgColors.grey}`,
      mt: 2,
    },
    emptyText: {
      color: morkBorgColors.yellow,
      opacity: 0.5,
    },
    sectionTitle: {
      mb: 1,
    },
    classAbilitiesHeading: {
      ...sectionStamp,
      mb: 0,
      transform: 'rotate(-0.4deg)',
      position: 'relative' as const,
      zIndex: 1,
    },
    classAbilitiesCard: {
      bgcolor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      p: { xs: 1.5, sm: 2 },
      pt: { xs: 1, sm: 1.5 },
    },
    abilitiesList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 0,
    },
    abilityItem: (rotate: number) => ({
      py: 1.5,
      px: 1.5,
      pl: 2,
      borderLeft: `5px solid ${morkBorgColors.pink}`,
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.25, 0, 0.2, 1)',
      transform: `rotate(${rotate}deg)`,
      display: 'flex',
      gap: 1.5,
      alignItems: 'flex-start',
      '&:hover': {
        borderLeftWidth: '8px',
        bgcolor: 'rgba(255, 62, 181, 0.08)',
        transform: `rotate(${rotate}deg) translateX(4px)`,
      },
      '& + &': {
        borderTop: `1px dashed rgba(255, 255, 255, 0.1)`,
      },
    }),
    abilityIndex: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
      color: morkBorgColors.pink,
      lineHeight: 1,
      flexShrink: 0,
      mt: 0.25,
      userSelect: 'none' as const,
    },
    abilityContent: {
      flex: 1,
      minWidth: 0,
    },
    abilityName: {
      color: morkBorgColors.white,
      fontFamily: "'Caveat Brush', cursive",
      fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
      lineHeight: 1.2,
      letterSpacing: '0.02em',
    },
    abilityDescription: {
      color: morkBorgColors.yellow,
      opacity: 0.6,
      fontSize: '0.78rem',
      fontStyle: 'italic' as const,
      fontFamily: "'Alegreya', serif",
      mt: 0.5,
      lineHeight: 1.5,
    },
    abilityComment: {
      mt: 1,
      '& .MuiInput-root': {
        color: `${morkBorgColors.yellow} !important`,
        fontSize: '0.8rem',
        '&:before': { borderBottomColor: 'rgba(255, 255, 255, 0.15)' },
        '&:after': { borderBottomColor: morkBorgColors.pink },
      },
      '& .MuiInput-input': {
        color: `${morkBorgColors.yellow} !important`,
      },
      '& .MuiInputLabel-root': {
        color: `${morkBorgColors.yellow} !important`,
        opacity: 0.4,
        fontSize: '0.7rem',
      },
    },
    // Traits section — dark container, scrawled character notes
    traitsHeading: {
      ...sectionStamp,
      mb: 0,
      transform: 'rotate(0.4deg)',
      alignSelf: 'flex-start',
      position: 'relative' as const,
      zIndex: 1,
    },
    traitsCard: {
      bgcolor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      p: { xs: 1.5, sm: 2 },
      pt: { xs: 1, sm: 1.5 },
      mb: 2,
    },
    traitsLabel: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.5rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.25em',
      color: morkBorgColors.black,
      opacity: 0.4,
      mb: 0.5,
      mt: 0.5,
    },
    traitsField: {
      '& .MuiInput-root': {
        color: `${morkBorgColors.white} !important`,
        fontFamily: "'Caveat Brush', cursive",
        fontSize: 'clamp(1.15rem, 3vw, 1.5rem)',
        lineHeight: 1.1,
        '&:before': {
          borderBottomColor: morkBorgColors.pink,
          opacity: 0.4,
          borderBottomWidth: '2px',
        },
        '&:hover:not(.Mui-disabled):before': {
          borderBottomColor: morkBorgColors.pink,
          opacity: 0.7,
        },
        '&:after': { borderBottomColor: morkBorgColors.pink },
      },
      '& .MuiInput-input': {
        color: `${morkBorgColors.white} !important`,
        pb: 0.75,
      },
      '& .MuiInputLabel-root': {
        color: `${morkBorgColors.yellow} !important`,
        opacity: 0.4,
        fontFamily: "'Antonio', sans-serif",
        fontSize: '0.65rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.2em',
      },
    },
    traitsFieldHabit: {
      '& .MuiInput-root': {
        color: `${morkBorgColors.yellow} !important`,
        fontFamily: "'Alegreya', serif",
        fontSize: '0.85rem',
        fontStyle: 'italic' as const,
        '&:before': { borderBottomColor: morkBorgColors.pink, opacity: 0.25 },
        '&:hover:not(.Mui-disabled):before': {
          borderBottomColor: morkBorgColors.pink,
          opacity: 0.5,
        },
        '&:after': { borderBottomColor: morkBorgColors.pink },
      },
      '& .MuiInput-input': {
        color: `${morkBorgColors.yellow} !important`,
        pb: 0.5,
      },
      '& .MuiInputLabel-root': {
        color: `${morkBorgColors.yellow} !important`,
        opacity: 0.4,
        fontFamily: "'Antonio', sans-serif",
        fontSize: '0.65rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.2em',
      },
    },
    // Origin section — dark container
    originOpen: {
      mb: 0,
    },
    originLabel: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.62rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.2em',
      color: morkBorgColors.black,
      opacity: 0.78,
      mb: 0.5,
      mt: 0.5,
    },
    originTextarea: {
      bgcolor: morkBorgColors.black,
      p: 2,
      '& .MuiInput-root': {
        color: `${morkBorgColors.yellow} !important`,
        fontFamily: "'Alegreya', serif",
        fontSize: '0.9rem',
        fontStyle: 'italic' as const,
        '&:before': { borderBottom: 'none' },
        '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
        '&:after': { borderBottom: 'none' },
      },
      '& .MuiInput-input': {
        color: `${morkBorgColors.yellow} !important`,
      },
      '& .MuiInputLabel-root': {
        display: 'none',
      },
    },
    originPlaceholder: {
      '& .MuiInput-input': {
        color: `${morkBorgColors.yellow} !important`,
      },
      '& .MuiInput-input::placeholder': {
        color: `${morkBorgColors.yellow} !important`,
        opacity: 0.35,
        fontStyle: 'italic' as const,
      },
    },
  },

  // Collapsible section styles (character page)
  collapsibleSection: {
    accordion: {
      mb: 2,
      bgcolor: 'transparent',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none',
      '&:before': { display: 'none' },
    },
    summary: {
      px: 0,
      py: 0,
      minHeight: 0,
      '& .MuiAccordionSummary-content': {
        margin: '0 0 0 0',
      },
    },
    title: {
      ...sectionStamp,
      letterSpacing: '0.15em',
    },
    details: {
      px: 0,
      pb: 0,
    },
    expandIcon: {
      color: morkBorgColors.black,
    },
  },

  // Inventory section styles
  inventorySection: {
    // On Hand — dark container
    openContainer: {
      mb: 2,
      bgcolor: morkBorgColors.black,
      border: `2px solid ${morkBorgColors.black}`,
      p: { xs: 1.5, sm: 2 },
      pt: { xs: 1, sm: 1.5 },
      position: 'relative' as const,
    },
    openItemSlot: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
      cursor: 'pointer',
      py: 1.25,
      px: 1.5,
      borderLeft: `3px solid ${morkBorgColors.pink}`,
      mb: 0.75,
      transition: 'all 0.15s ease-in-out',
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        transform: 'translateX(4px)',
        borderLeftColor: morkBorgColors.yellow,
      },
    },
    openItemName: {
      color: morkBorgColors.white,
      fontSize: '1rem',
      fontWeight: 'bold',
      lineHeight: 1.2,
    },
    openItemDescription: {
      color: morkBorgColors.yellow,
      opacity: 0.7,
      fontStyle: 'italic' as const,
      fontSize: '0.8rem',
      mt: 0.25,
    },
    itemSlot: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
      cursor: 'pointer',
      p: 1.5,
      transition: 'all 0.15s ease-in-out',
      '&:hover': {
        bgcolor: 'rgba(255,255,255,0.05)',
        transform: 'translateX(4px)',
      },
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      color: morkBorgColors.white,
      fontSize: '1.1rem',
      fontWeight: 'bold',
      lineHeight: 1.2,
    },
    itemDescription: {
      color: morkBorgColors.yellow,
      fontStyle: 'italic' as const,
      fontSize: '0.85rem',
      mt: 0.5,
    },
    modalContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2.5,
    },
    quantityLabel: {
      color: morkBorgColors.grey,
      fontSize: '0.75rem',
      mb: 0.5,
      textTransform: 'uppercase' as const,
    },
    quantityControls: {
      display: 'flex',
      gap: 1.5,
      alignItems: 'center',
    },
    quantityNumber: {
      color: morkBorgColors.yellow,
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.8rem',
      minWidth: 40,
      textAlign: 'center' as const,
    },
    equipButtons: {
      display: 'flex',
      gap: 1,
      flexWrap: 'wrap' as const,
    },
    actionButtons: {
      display: 'flex',
      gap: 1,
      flexWrap: 'wrap' as const,
      mt: 1,
    },
    dropButton: {
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
    },
    modalFooter: {
      display: 'flex',
      gap: 1,
      pt: 2,
      borderTop: '1px solid rgba(255,255,255,0.1)',
    },
    cancelButton: {
      color: morkBorgColors.grey,
      flexShrink: 0,
    },
    sectionTitle: {
      ...sectionStamp,
      mb: 0,
      transform: 'rotate(-0.6deg)',
      position: 'relative' as const,
      zIndex: 1,
    },
    itemsGrid: {
      display: 'grid',
      gap: 1,
    },
    addItemSection: {
      mt: 2,
    },
    // Open variant: style autocomplete for dark background
    openAddItem: {
      mt: 2,
      '& .MuiAutocomplete-root': {
        '& .MuiOutlinedInput-root': {
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          color: morkBorgColors.white,
          borderRadius: 0,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: morkBorgColors.yellow,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: morkBorgColors.pink,
          },
        },
        '& .MuiInputLabel-root': {
          color: morkBorgColors.yellow,
          opacity: 0.5,
          fontFamily: "'Antonio', sans-serif",
          textTransform: 'uppercase' as const,
          letterSpacing: '0.15em',
          '&.Mui-focused': {
            color: morkBorgColors.pink,
            opacity: 1,
          },
        },
        '& .MuiAutocomplete-input': {
          color: `${morkBorgColors.white} !important`,
        },
        '& .MuiSvgIcon-root': {
          color: morkBorgColors.yellow,
          opacity: 0.4,
        },
      },
    },
  },

  // Powers section styles
  powersSection: {
    container: {
      bgcolor: morkBorgColors.pink,
      border: `3px solid ${morkBorgColors.black}`,
      boxShadow: `6px 6px 0 ${morkBorgColors.black}`,
      p: { xs: 1.5, sm: 2 },
      pt: { xs: 1, sm: 1.5 },
    },
    sectionLabel: {
      ...sectionStamp,
      mb: 0,
      transform: 'rotate(-0.3deg)',
      position: 'relative' as const,
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: 'fit-content',
      minWidth: { xs: '120px', sm: '150px' },
    },
    savingIndicator: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '0.75rem',
      color: morkBorgColors.black,
      backgroundColor: morkBorgColors.pink,
      px: 0.6,
      py: 0.1,
      ml: 1.5,
      border: `1px solid ${morkBorgColors.black}`,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      animation: 'pulse-opacity 1s ease-in-out infinite',
      '@keyframes pulse-opacity': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.4 },
      },
    },
    emptyText: {
      color: morkBorgColors.black,
      opacity: 0.6,
      fontStyle: 'italic' as const,
      mt: 1,
    },
    contentContainer: {
      mt: 0,
    },
    powerRow: {
      display: 'grid',
      gridTemplateColumns: {
        xs: 'auto minmax(0, 1fr)',
        sm: 'auto minmax(0, 1fr) auto',
      },
      columnGap: 1.5,
      rowGap: { xs: 0.6, sm: 0 },
      alignItems: 'flex-start',
      py: 1.25,
      px: 1.5,
      transition: 'all 0.15s ease',
      '@media (hover: hover) and (pointer: fine)': {
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.08)',
          transform: 'translateX(4px)',
        },
      },
      '&:hover': {
        '@media (hover: none), (pointer: coarse)': {
          bgcolor: 'transparent',
          transform: 'none',
        },
      },
      '& + &': {
        borderTop: `1px solid rgba(10, 10, 10, 0.15)`,
      },
    },
    powerText: {
      gridColumn: '2 / 3',
      minWidth: 0,
    },
    powerNumber: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
      color: morkBorgColors.black,
      lineHeight: 1,
      flexShrink: 0,
      mt: 0.25,
      userSelect: 'none' as const,
    },
    powerName: {
      color: morkBorgColors.black,
      fontFamily: "'Caveat Brush', cursive",
      fontSize: { xs: '1.05rem', sm: 'clamp(1rem, 2.5vw, 1.15rem)' },
      lineHeight: 1.2,
      letterSpacing: '0.02em',
    },
    powerDescription: {
      color: morkBorgColors.black,
      opacity: 0.6,
      fontSize: { xs: '0.9rem', sm: '0.78rem' },
      fontStyle: 'italic' as const,
      fontFamily: "'Alegreya', serif",
      mt: 0.5,
      lineHeight: 1.5,
    },
    usePipsContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: { xs: 0.75, sm: 0.6 },
      justifyContent: { xs: 'flex-start', sm: 'flex-end' },
      alignItems: 'center',
      gridColumn: { xs: '2 / -1', sm: '3 / 4' },
      gridRow: { xs: '2 / 3', sm: '1 / 2' },
      width: { xs: '100%', sm: 'auto' },
    },
    usePip: {
      base: {
        width: { xs: 36, sm: 28 },
        height: { xs: 36, sm: 28 },
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'transform 0.1s ease',
        p: 0,
        m: 0,
        appearance: 'none',
        WebkitAppearance: 'none',
        flexShrink: 0,
        touchAction: 'manipulation',
        bgcolor: 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        '--pip-fill': 'transparent',
        '&::before': {
          content: '""',
          width: { xs: 20, sm: 18 },
          height: { xs: 20, sm: 18 },
          border: `2px solid ${morkBorgColors.black}`,
          borderRadius: '50%',
          bgcolor: 'var(--pip-fill)',
          boxSizing: 'border-box',
          transition: 'background-color 0.1s, transform 0.1s',
        },
        '&:active::before': {
          transform: 'scale(0.93)',
        },
      },
      used: {
        '--pip-fill': morkBorgColors.black,
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            '--pip-fill': morkBorgColors.pink,
          },
        },
      },
      unused: {
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover': {
            '--pip-fill': 'rgba(255,62,181,0.3)',
          },
        },
      },
    },
  },
};

export const morkBorgTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: morkBorgColors.yellow,
      contrastText: morkBorgColors.black,
    },
    secondary: {
      main: morkBorgColors.pink,
      contrastText: morkBorgColors.black,
    },
    background: {
      default: morkBorgColors.yellow,
      paper: morkBorgColors.black,
    },
    text: {
      primary: morkBorgColors.white,
      secondary: morkBorgColors.pink,
    },
    error: {
      main: '#8b0000',
    },
  },

  typography: {
    fontFamily: "'Alegreya', Georgia, serif",

    h1: {
      fontFamily: "'Caveat Brush', cursive",
      fontSize: '3rem',
      textTransform: 'uppercase',
      lineHeight: 0.85,
    },
    h2: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '2rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h3: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.5rem',
      textTransform: 'uppercase',
      '@media (max-width:600px)': {
        fontSize: '1.65rem',
      },
    },
    h4: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.2rem',
      textTransform: 'uppercase',
    },
    subtitle1: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      '@media (max-width:600px)': {
        fontSize: '0.82rem',
      },
    },
    subtitle2: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      '@media (max-width:600px)': {
        fontSize: '0.76rem',
      },
    },
    body1: {
      fontFamily: "'Alegreya', serif",
      fontSize: '0.9rem',
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontFamily: "'Alegreya', serif",
      fontSize: '0.85rem',
      '@media (max-width:600px)': {
        fontSize: '0.95rem',
      },
    },
    button: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1rem',
      letterSpacing: '0.05em',
    },
  },

  shape: {
    borderRadius: 0,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-color: ${morkBorgColors.yellow};
        }

        /*
         * Focus ring is two-tone so it stays visible on both the yellow body
         * and the black/pink surfaces: black inner ring carries contrast on
         * yellow, pink halo carries contrast on black.
         */
        button:focus-visible,
        [role="button"]:focus-visible,
        a:focus-visible,
        input:focus-visible,
        textarea:focus-visible,
        select:focus-visible,
        [tabindex]:focus-visible {
          outline: 2px solid ${morkBorgColors.black};
          outline-offset: 2px;
          box-shadow: 0 0 0 6px ${morkBorgColors.pink};
        }
      `,
    },

    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `2px solid ${morkBorgColors.black}`,
            outlineOffset: '2px',
            boxShadow: `0 0 0 6px ${morkBorgColors.pink}`,
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          textTransform: 'uppercase',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: morkBorgColors.pink,
          color: morkBorgColors.black,
          '&:hover': {
            backgroundColor: morkBorgColors.yellow,
          },
        },
        containedSecondary: {
          backgroundColor: morkBorgColors.grey,
          color: morkBorgColors.white,
          border: `2px solid ${morkBorgColors.white}`,
          '&:hover': {
            backgroundColor: morkBorgColors.white,
            color: morkBorgColors.black,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundImage: 'none',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: morkBorgColors.black,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: morkBorgColors.grey,
            '& fieldset': {
              borderColor: morkBorgColors.darkGrey,
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: morkBorgColors.yellow,
            },
            '&.Mui-focused fieldset': {
              borderColor: morkBorgColors.yellow,
            },
          },
          '& .MuiInputBase-input': {
            color: morkBorgColors.white,
          },
          '& .MuiInputLabel-root': {
            color: morkBorgColors.pink,
            fontFamily: "'Antonio', sans-serif",
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
          },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: "'Antonio', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `4px solid ${morkBorgColors.yellow}`,
          boxShadow: `10px 10px 0 ${morkBorgColors.pink}`,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: morkBorgColors.yellow,
          color: morkBorgColors.black,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.5rem',
          textTransform: 'uppercase',
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: morkBorgColors.yellow,
          color: morkBorgColors.black,
          fontFamily: "'Alegreya', serif",
          fontSize: '0.8rem',
          borderRadius: 0,
          boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
        },
      },
    },
  },
});
