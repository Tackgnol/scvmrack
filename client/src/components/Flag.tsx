import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box} from '@mui/material';
import {morkBorgColors} from '@theme/morkBorgTheme.ts';

interface FlagProps {
    locale: 'en' | 'pl';
}

export function Flag({locale}: FlagProps) {
    const {locale: currentLocale, changeLocale} = useCharacter();
    const isActive = currentLocale === locale;
    const isUK = locale === 'en';

    const countryCode = locale === 'en' ? 'GB' : 'PL';

    return (
        <Box
            component="button"
            onClick={() => changeLocale(locale)}
            sx={{
                width: 48,
                height: 36,
                cursor: 'pointer',
                border: isActive
                    ? `3px solid ${morkBorgColors.yellow}`
                    : `3px solid ${morkBorgColors.grey}`,
                boxShadow: isActive
                    ? `4px 4px 0 ${morkBorgColors.pink}`
                    : `2px 2px 0 ${morkBorgColors.black}`,
                transform: isActive
                    ? `rotate(${isUK ? '-2deg' : '2deg'})`
                    : `rotate(${isUK ? '1deg' : '-1deg'})`,
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
                padding: 0,
                backgroundImage: `url(https://flagsapi.com/${countryCode}/flat/64.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: isActive
                    ? 'contrast(1.2) saturate(1.3)'
                    : 'contrast(0.9) saturate(0.8) brightness(0.85)',
                '&:hover': {
                    transform: `rotate(${isUK ? '-4deg' : '4deg'}) scale(1.05)`,
                    boxShadow: `6px 6px 0 ${morkBorgColors.yellow}`,
                    filter: 'contrast(1.3) saturate(1.4) brightness(1.1)',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: isActive
                        ? 'transparent'
                        : 'rgba(0, 0, 0, 0.2)',
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                },
            }}
        />
    );
}
