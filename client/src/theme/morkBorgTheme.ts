import { createTheme } from '@mui/material/styles';
import type { MorkBorgColors, StatColorMap } from '../types';

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

// Custom reusable styles
export const customStyles = {
  // Navigation styles
  navLink: {
    base: {
      width: 100,
      height: 44,
      cursor: 'pointer',
      transition: 'all 0.2s',
      bgcolor: morkBorgColors.black,
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Pirata One", serif',
      fontSize: '1.2rem',
      textTransform: 'uppercase' as const,
    },
    active: {
      border: `3px solid ${morkBorgColors.yellow}`,
      boxShadow: `4px 4px 0 ${morkBorgColors.pink}`,
      transform: 'rotate(-1.5deg)',
      color: morkBorgColors.yellow,
    },
    inactive: {
      border: `3px solid ${morkBorgColors.grey}`,
      boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
      transform: 'rotate(1deg)',
      color: morkBorgColors.white,
    },
    hover: {
      transform: 'rotate(-2deg) scale(1.02)',
      boxShadow: `6px 6px 0 ${morkBorgColors.yellow}`,
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
      minWidth: 220,
    },
    item: {
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
      '&:hover': { bgcolor: '#222' },
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
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      transition: 'all 0.2s ease',
      border: '1px solid transparent',
      backgroundColor: '#111',
    },
    hover: {
      backgroundColor: '#1a1a1a',
      borderColor: morkBorgColors.pink,
      transform: 'translateY(-2px)',
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
      fontFamily: '"Pirata One", serif',
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
        '&:hover:not(.Mui-disabled):before': { borderBottomColor: morkBorgColors.yellow },
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
        '&:hover:not(.Mui-disabled):before': { borderBottomColor: morkBorgColors.yellow },
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
      fontFamily: "'Permanent Marker', cursive",
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
      fontFamily: "'Permanent Marker', cursive",
      fontSize: '1.3rem',
      color: morkBorgColors.black,
      marginBottom: '10px',
    },
    input: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: morkBorgColors.white,
        border: `3px solid ${morkBorgColors.black}`,
        '& fieldset': { border: 'none' },
        '& textarea': {
          color: morkBorgColors.black,
        },
      },
    },
  },

  // Resource input
  resourceInput: {
    width: 80,
    '& .MuiOutlinedInput-root': {
      backgroundColor: morkBorgColors.yellow,
      '& input': {
        color: morkBorgColors.black,
        textAlign: 'center' as const,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.3rem',
        padding: '6px',
      },
      '& fieldset': { border: 'none' },
    },
  },

  // Footer button
  footerButton: {
    backgroundColor: morkBorgColors.pink,
    border: `2px solid ${morkBorgColors.black}`,
    color: morkBorgColors.black,
    fontFamily: "'Antonio', sans-serif",
    fontSize: '0.7rem',
    letterSpacing: '0.2em',
    '&:hover': {
      backgroundColor: morkBorgColors.yellow,
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
    fontFamily: '"Pirata One", serif',
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
      marginBottom: '20px',
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
        fontFamily: "'Pirata One', serif",
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
    width: 32,
    height: 32,
    backgroundColor: morkBorgColors.grey,
    border: `2px solid ${morkBorgColors.yellow}`,
    color: morkBorgColors.yellow,
    '&:hover': {
      backgroundColor: morkBorgColors.yellow,
      color: morkBorgColors.black,
    },
  },

  // Ability value input
  abilityValueInput: {
    width: 50,
    '& .MuiOutlinedInput-root': {
      backgroundColor: morkBorgColors.yellow,
      '& input': {
        color: morkBorgColors.black,
        textAlign: 'center' as const,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '2rem',
        padding: '4px',
      },
      '& fieldset': { border: 'none' },
    },
  },

  // Summary bar HP input
  hpInput: {
    width: 45,
    '& .MuiOutlinedInput-root': {
      bgcolor: 'secondary.main',
      '& input': {
        color: morkBorgColors.black,
        textAlign: 'center' as const,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.4rem',
        p: 0.5,
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
      mb: 2.5,
    },
    paper: {
      p: 1.5,
      textAlign: 'center' as const,
      flexDirection: 'column',
      display:'flex',
      alignItems: 'center'
    },
    label: {
      mb: 0.75,
      fontSize: '0.6rem',
    },
  },

  // Footer styles
  footer: {
    paper: {
      textAlign: 'center' as const,
      p: 3,
    },
    title: {
      color: morkBorgColors.yellow,
      letterSpacing: '0.3em',
      '& span': { color: morkBorgColors.pink },
    },
    buttonContainer: {
      display: 'flex',
      gap: 2,
      justifyContent: 'center',
      mt: 2,
    },
  },

  // Abilities styles
  abilities: {
    container: {
      mb: 2.5,
    },
    title: {
      color: morkBorgColors.black,
      borderBottom: `4px solid ${morkBorgColors.black}`,
      pb: 0.5,
      mb: 1.5,
      display: 'inline-block',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
      gap: 1.25,
    },
  },

  // LoggedOutBanner styles
  loggedOutBanner: {
    alert: {
      mb: 2,
      bgcolor: `${morkBorgColors.yellow}22`,
      border: `1px solid ${morkBorgColors.yellow}`,
      '& .MuiAlert-icon': { color: morkBorgColors.yellow },
    },
    button: {
      ml: 2,
      borderColor: morkBorgColors.yellow,
      '&:hover': { bgcolor: `${morkBorgColors.yellow}33` },
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

  // SnackbarProvider Alert
  snackbarAlert: {
    width: '100%',
    alignItems: 'center',
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

  // Character name box
  characterNameBox: {
    bgcolor: morkBorgColors.pink,
    p: 2,
    boxShadow: `5px 5px 0 ${morkBorgColors.black}`,
  },

  // Character name label
  characterNameLabel: {
    color: morkBorgColors.black,
    mb: 0.5,
    fontSize: '0.6rem',
  },

  // Character name text
  characterNameText: {
    fontFamily: "'Permanent Marker', cursive",
    fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
    color: morkBorgColors.black,
    borderBottom: `3px solid ${morkBorgColors.black}`,
    minHeight: '2rem',
  },

  // Character trait text
  characterTraitText: {
    fontFamily: "'Permanent Marker', cursive",
    fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
    color: morkBorgColors.black,
    opacity: 0.8,
    mt: 0.5,
  },

  // Character class paper
  characterClassPaper: {
    p: 2,
    boxShadow: `5px 5px 0 ${morkBorgColors.pink}`,
  },

  // Character class label
  characterClassLabel: {
    mb: 0.5,
    fontSize: '0.6rem',
  },

  // Character class text
  characterClassText: {
    fontFamily: "'Permanent Marker', cursive",
    fontSize: 'clamp(1rem, 3vw, 1.4rem)',
    color: morkBorgColors.yellow,
    borderBottom: `1px solid ${morkBorgColors.yellow}`,
    minHeight: '1.8rem',
  },

  // Character class description
  characterClassDescription: {
    mt: 1,
    color: morkBorgColors.white,
    opacity: 0.7,
  },

  // Character name/class grid
  characterNameClassGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: 2,
    mb: 2.5,
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
      borderBottom: `4px solid ${morkBorgColors.pink}`,
      pb: 0.5,
      mb: 1.5,
      display: 'inline-block',
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
      p: 2.5,
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
    title: (isMobile: boolean) => ({
      color: morkBorgColors.yellow,
      fontSize: isMobile ? '2.2rem' : 'clamp(2.5rem, 10vw, 5rem)',
      lineHeight: 1,
      '& span': { color: morkBorgColors.pink },
    }),
    subtitle: (isMobile: boolean) => ({
      color: morkBorgColors.white,
      letterSpacing: isMobile ? '0.2em' : '0.5em',
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
      gap: 2,
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    navBar: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
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
      fontFamily: '"Pirata One", serif',
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
      fontFamily: '"Pirata One", serif',
      borderColor: morkBorgColors.yellow,
      color: morkBorgColors.yellow,
      '@keyframes spin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
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
      p: 2,
      textAlign: 'center' as const,
      transform: `rotate(${rotate}deg)`,
    }),
    label: {
      mb: 1,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.75,
    },
    modifier: {
      mt: 1,
      color: morkBorgColors.white,
    },
    description: {
      mt: 0.5,
      opacity: 0.6,
      fontStyle: 'italic' as const,
      fontSize: '0.6rem',
    },
  },

  // Mork Borg Modal styles
  morkBorgModal: {
    dialogPaper: {
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
    },
    dialogActions: {
      p: 2,
      borderTop: `2px solid ${morkBorgColors.grey}`,
    },
  },

  // Modal button variants
  modalButton: {
    primary: {
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      '&:hover': { bgcolor: morkBorgColors.yellow },
    },
    secondary: {
      bgcolor: morkBorgColors.grey,
      color: morkBorgColors.white,
      border: `2px solid ${morkBorgColors.white}`,
      '&:hover': {
        bgcolor: morkBorgColors.white,
        color: morkBorgColors.black,
      },
    },
    danger: {
      bgcolor: '#8b0000',
      color: morkBorgColors.white,
      '&:hover': {
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
      },
    },
  },

  // Session warning banner styles
  sessionWarning: {
    alert: {
      mb: 2,
      bgcolor: `${morkBorgColors.yellow}22`,
      border: `1px solid ${morkBorgColors.yellow}`,
      '& .MuiAlert-icon': { color: morkBorgColors.yellow },
      '& .MuiAlert-message': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        flexWrap: 'wrap' as const,
        gap: 1,
      },
    },
    buttonContainer: {
      display: 'flex',
      gap: 1,
      flexShrink: 0,
    },
    signUpButton: {
      borderColor: morkBorgColors.yellow,
      '&:hover': { bgcolor: `${morkBorgColors.yellow}33` },
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
      fontFamily: '"Pirata One", serif',
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
      fontFamily: '"Pirata One", serif',
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
      fontFamily: '"Pirata One", serif',
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
      fontFamily: '"Pirata One", serif',
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
      mb: 2.5,
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
    menuUnequipItem: {
      color: morkBorgColors.yellow,
    },
    menuDivider: {
      bgcolor: '#333',
    },
    menuItemName: {
      color: morkBorgColors.yellow,
      fontWeight: 'bold',
    },
    menuItemDescription: {
      color: morkBorgColors.pink,
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
      mb: 2.5,
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
      color: morkBorgColors.white,
      opacity: 0.5,
    },
    sectionTitle: {
      mb: 1,
    },
  },

  // Inventory section styles
  inventorySection: {
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
      mb: 2,
      color: morkBorgColors.pink,
    },
    itemsGrid: {
      display: 'grid',
      gap: 1,
    },
    addItemSection: {
      mt: 4,
    },
  },

  // Powers section styles
  powersSection: {
    paper: {
      p: 2.5,
      mb: 2.5,
      border: `3px solid ${morkBorgColors.pink}`,
      position: 'relative' as const,
    },
    sectionLabel: {
      position: 'absolute' as const,
      top: -12,
      left: 15,
      bgcolor: morkBorgColors.pink,
      color: morkBorgColors.black,
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.6rem',
      letterSpacing: '0.3em',
      px: 1.25,
      py: 0.4,
    },
    emptyText: {
      color: morkBorgColors.grey,
      fontStyle: 'italic' as const,
      mt: 1,
    },
    contentContainer: {
      mt: 1,
    },
    powerRow: {
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '30px 1fr 100px' },
      gap: 1.25,
      alignItems: 'center',
      py: 1.25,
      borderBottom: `1px solid ${morkBorgColors.grey}`,
      '&:last-child': { borderBottom: 'none' },
    },
    powerNumber: {
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: '1.2rem',
      color: morkBorgColors.yellow,
      textAlign: 'center' as const,
      display: { xs: 'none', sm: 'block' },
    },
    powerName: {
      color: morkBorgColors.white,
      fontSize: '0.9rem',
      fontWeight: 'bold',
    },
    powerDescription: {
      color: morkBorgColors.yellow,
      fontSize: '0.75rem',
      fontStyle: 'italic' as const,
    },
    usePipsContainer: {
      display: 'flex',
      gap: 0.6,
      justifyContent: { xs: 'flex-start', sm: 'flex-end' },
    },
    usePip: {
      base: {
        width: 18,
        height: 18,
        border: `2px solid ${morkBorgColors.pink}`,
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
      },
      used: {
        bgcolor: morkBorgColors.pink,
        '&:hover': {
          bgcolor: morkBorgColors.pink,
        },
      },
      unused: {
        bgcolor: 'transparent',
        '&:hover': {
          bgcolor: 'rgba(255,62,181,0.3)',
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
    fontFamily: "'Libre Baskerville', Georgia, serif",

    h1: {
      fontFamily: "'Permanent Marker', cursive",
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
    },
    subtitle2: {
      fontFamily: "'Antonio', sans-serif",
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    body1: {
      fontFamily: "'Libre Baskerville', serif",
      fontSize: '0.9rem',
    },
    body2: {
      fontFamily: "'Libre Baskerville', serif",
      fontSize: '0.85rem',
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
      `,
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
          fontFamily: "'Libre Baskerville', serif",
          fontSize: '0.8rem',
          borderRadius: 0,
          boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
        },
      },
    },
  },
});
