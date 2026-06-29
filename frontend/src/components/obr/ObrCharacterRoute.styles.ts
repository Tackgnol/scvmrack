import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Button, CircularProgress, Stack, Typography, styled } from '@mui/material';

export const Centered = styled(Box)({
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: morkBorgColors.yellow,
});

export const Panel = styled(Stack)({
    maxWidth: 320,
    width: '100%',
    alignItems: 'center',
    gap: 16,
});

export const BrandTitle = styled(Typography)({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.6rem',
    letterSpacing: '0.04em',
    color: morkBorgColors.black,
});

export const Hint = styled(Typography)({
    fontFamily: "'Alegreya', serif",
    fontStyle: 'italic',
    textAlign: 'center',
    color: morkBorgColors.black,
    opacity: 0.7,
});

export const ErrorText = styled(Typography)({
    fontSize: '0.75rem',
    color: morkBorgColors.blood,
});

export const Spinner = styled(CircularProgress)({
    color: morkBorgColors.pink,
});

export const InlineSpinner = styled(CircularProgress)({
    color: morkBorgColors.pink,
    alignSelf: 'center',
});

export const PickList = styled(Stack)({
    width: '100%',
    gap: 8,
});

export const PickButton = styled(Button)({
    justifyContent: 'flex-start',
});
