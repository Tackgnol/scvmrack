import { morkBorgColors } from '@/theme/morkBorgTheme';
import { styled } from '@mui/material';

export const BindBar = styled('div')({
    position: 'sticky',
    top: 0,
    zIndex: 20,
    alignSelf: 'start',
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 8,
    padding: '7px 12px',
    background: morkBorgColors.black,
    borderBottom: '2px solid #2a2a2a',
    boxShadow: '0 2px 0 rgba(0, 0, 0, 0.35)',
});

export const BindStatus = styled('span')({
    minWidth: 0,
    fontFamily: "'Antonio', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontSize: '0.62rem',
    color: '#b5b5b5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

export const BindButton = styled('button')({
    fontFamily: "'Antonio', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.78rem',
    padding: '6px 12px',
    minWidth: 164,
    background: 'transparent',
    color: morkBorgColors.pink,
    border: `1px solid ${morkBorgColors.pink}`,
    cursor: 'pointer',
    transition: 'background-color 160ms ease-out, color 160ms ease-out, opacity 160ms ease-out',
    '&:hover:not(:disabled), &:focus-visible': {
        background: morkBorgColors.pink,
        color: morkBorgColors.black,
    },
    '&:disabled': {
        cursor: 'default',
        opacity: 0.48,
    },
    '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
    },
});
