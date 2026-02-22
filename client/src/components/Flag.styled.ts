import { styled } from '@mui/material';
import { morkBorgColors, customStyles } from '@theme/morkBorgTheme';

interface StyledFlagButtonProps {
    isActive: boolean;
    isUK: boolean;
    countryCode: string;
}

export const StyledFlagButton = styled('button', {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isUK' && prop !== 'countryCode',
})<StyledFlagButtonProps>(({ isActive, isUK, countryCode }) => ({
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    margin: 0,
    font: 'inherit',
    backfaceVisibility: 'hidden',
    willChange: 'transform, box-shadow, opacity',
    contain: 'paint',
    ...customStyles.flagButton.base,
    ...(isActive ? customStyles.flagButton.active : customStyles.flagButton.inactive),
    transitionProperty: 'box-shadow, border-color, opacity, transform',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    transform: isActive
        ? `rotate(${isUK ? '-2deg' : '2deg'})`
        : `rotate(${isUK ? '1deg' : '-1deg'})`,
    filter: 'none',
    opacity: isActive ? 1 : 0.88,
    backgroundImage: `url(https://flagsapi.com/${countryCode}/flat/64.png)`,
    '&:hover': {
        // Keep transform stable on hover to avoid repaint flashes.
        transform: isActive
            ? `rotate(${isUK ? '-2deg' : '2deg'})`
            : `rotate(${isUK ? '1deg' : '-1deg'})`,
        boxShadow: `5px 5px 0 ${morkBorgColors.yellow}`,
        opacity: 1,
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: isActive ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
        pointerEvents: 'none',
    },
}));
