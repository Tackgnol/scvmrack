import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Typography, styled } from '@mui/material';

export const Wrapper = styled(Box)({
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    color: morkBorgColors.black,
    '& .MuiInputLabel-root.MuiInputLabel-shrink': {
        color: morkBorgColors.black,
    },
    '& .MuiButton-text': {
        color: morkBorgColors.black,
    },
});

export const Message = styled(Typography)({
    fontFamily: "'Alegreya', serif",
    fontStyle: 'italic',
    color: morkBorgColors.black,
});
