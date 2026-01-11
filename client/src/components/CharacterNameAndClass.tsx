import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, CircularProgress, Paper, Typography} from '@mui/material';
import {morkBorgColors} from '../theme/morkBorgTheme';

export const CharacterNameAndClass = () => {
    const {character, isLoading} = useCharacter();

    if (isLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
                <CircularProgress sx={{color: morkBorgColors.yellow}}/>
            </Box>
        );
    }

    if (!character) {
        return (
            <Paper sx={{p: 2.5, mb: 2.5, textAlign: 'center'}}>
                <Typography color="secondary">No character loaded</Typography>
            </Paper>
        );
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'},
                gap: 2,
                mb: 2.5,
            }}
        >
            {/* Name */}
            <Box
                sx={{
                    bgcolor: morkBorgColors.pink,
                    p: 2,
                    boxShadow: `5px 5px 0 ${morkBorgColors.black}`,
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{color: morkBorgColors.black, mb: 0.5, fontSize: '0.6rem'}}
                >
                    Name
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Permanent Marker', cursive",
                        fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                        color: morkBorgColors.black,
                        borderBottom: `3px solid ${morkBorgColors.black}`,
                        minHeight: '2rem',
                    }}
                >
                    {character.name || 'Unnamed Wretch'}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Permanent Marker', cursive",
                        fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                        color: morkBorgColors.black,
                        opacity: 0.8,
                        mt: 0.5,
                    }}
                >
                    A {character.trait1 || 'mysterious'} and {character.trait2 || 'unknown'} {character.class_name || 'wretch'}
                </Typography>
            </Box>

            {/* Class */}
            <Paper
                sx={{
                    p: 2,
                    boxShadow: `5px 5px 0 ${morkBorgColors.pink}`,
                }}
            >
                <Typography variant="subtitle2" color="secondary" sx={{mb: 0.5, fontSize: '0.6rem'}}>
                    Class
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'Permanent Marker', cursive",
                        fontSize: 'clamp(1rem, 3vw, 1.4rem)',
                        color: morkBorgColors.yellow,
                        borderBottom: `1px solid ${morkBorgColors.yellow}`,
                        minHeight: '1.8rem',
                    }}
                >
                    {character.class_name || 'Classless'}
                </Typography>
                {character.class_description && (
                    <Typography variant="body2" sx={{mt: 1, color: morkBorgColors.white, opacity: 0.7}}>
                        {character.class_description}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}
