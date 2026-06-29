import { morkBorgColors } from '@/theme/morkBorgTheme';
import { styled } from '@mui/material';

export const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '100vh',
    minHeight: 0,
    overflow: 'hidden',
    background: morkBorgColors.yellow,
});

export const Bar = styled('div')({
    position: 'relative',
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '4px 12px',
    background: morkBorgColors.black,
    borderBottom: '2px solid #2a2a2a',
    flexShrink: 0,
});

export const Wordmark = styled('span')({
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: '0.08em',
    color: morkBorgColors.pink,
    fontSize: '0.95rem',
    whiteSpace: 'nowrap',
});

export const Actions = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginLeft: 'auto',
    minWidth: 0,
});

export const ExpandButton = styled('button')({
    fontFamily: "'Antonio', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.8rem',
    padding: '4px 12px',
    whiteSpace: 'nowrap',
    background: 'transparent',
    color: morkBorgColors.yellow,
    border: `1px solid ${morkBorgColors.yellow}`,
    cursor: 'pointer',
    '&:disabled': { cursor: 'default', opacity: 0.5 },
});

export const Body = styled('div')({
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateRows: 'minmax(0, 1fr)',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: '10px 8px 12px',
    '@media (min-width: 700px)': {
        padding: 12,
    },
});
