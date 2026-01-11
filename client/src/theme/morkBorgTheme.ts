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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Antonio:wght@400;700&family=Permanent+Marker&display=swap');
        
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
