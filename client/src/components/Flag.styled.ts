import { Box, styled } from '@mui/material';
import { morkBorgColors, customStyles } from '@theme/morkBorgTheme';

interface StyledFlagButtonProps {
    isActive: boolean;
    isUK: boolean;
    countryCode: string;
}

export const StyledFlagButton = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isUK' && prop !== 'countryCode',
})<StyledFlagButtonProps>(({ isActive, isUK, countryCode }) => ({
    ...customStyles.flagButton.base,
    ...(isActive ? customStyles.flagButton.active : customStyles.flagButton.inactive),
    transform: isActive
        ? `rotate(${isUK ? '-2deg' : '2deg'})`
        : `rotate(${isUK ? '1deg' : '-1deg'})`,
    backgroundImage: `url(https://flagsapi.com/${countryCode}/flat/64.png)`,
    '&:hover': {
        transform: `rotate(${isUK ? '-4deg' : '4deg'}) scale(1.05)`,
        boxShadow: `6px 6px 0 ${morkBorgColors.yellow}`,
        filter: 'contrast(1.3) saturate(1.4) brightness(1.1)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: isActive ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
    },
}));
