import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {Box, Paper, Typography} from '@mui/material';
import {morkBorgColors} from '../theme/morkBorgTheme';

interface UsePipProps {
    used: boolean;
    onClick: () => void;
}

function UsePip({used, onClick}: UsePipProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                width: 18,
                height: 18,
                border: `2px solid ${morkBorgColors.pink}`,
                borderRadius: '50%',
                bgcolor: used ? morkBorgColors.pink : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
                '&:hover': {
                    bgcolor: used ? morkBorgColors.pink : 'rgba(255,62,181,0.3)',
                },
            }}
        />
    );
}

interface PowerRowProps {
    number: number;
    powerKey: string;
    name: string;
    description?: string;
    uses: boolean[];
    onToggleUse: (useIndex: number) => void;
}

function PowerRow({number, name, description, uses, onToggleUse}: PowerRowProps) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {xs: '1fr', sm: '30px 1fr 70px'},
                gap: 1.25,
                alignItems: 'center',
                py: 1.25,
                borderBottom: `1px solid ${morkBorgColors.grey}`,
                '&:last-child': {borderBottom: 'none'},
            }}
        >
            <Typography
                sx={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.2rem',
                    color: morkBorgColors.yellow,
                    textAlign: 'center',
                    display: {xs: 'none', sm: 'block'},
                }}
            >
                {number}
            </Typography>

            <Box>
                <Typography
                    sx={{
                        color: morkBorgColors.white,
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                    }}
                >
                    {name}
                </Typography>
                {description && (
                    <Typography
                        sx={{
                            color: morkBorgColors.grey,
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>

            <Box
                sx={{display: 'flex', gap: 0.6, justifyContent: {xs: 'flex-start', sm: 'flex-end'}}}
            >
                {uses.map((used, useIndex) => (
                    <UsePip key={useIndex} used={used} onClick={() => onToggleUse(useIndex)}/>
                ))}
            </Box>
        </Box>
    );
}

export default function PowersSection() {
    const {character} = useCharacter();


    // Filter scrolls from equipment
    const scrolls = character?.equipment?.filter(
        (item) => item.key?.startsWith('scroll.')
    ) ?? [];

    if (scrolls.length === 0) {
        return (
            <Paper
                sx={{
                    p: 2.5,
                    mb: 2.5,
                    border: `3px solid ${morkBorgColors.pink}`,
                    position: 'relative',
                    '&::before': {
                        content: '"SCROLLS & POWERS"',
                        position: 'absolute',
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
                }}
            >
                <Typography sx={{color: morkBorgColors.grey, fontStyle: 'italic'}}>
                    No scrolls or powers
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                p: 2.5,
                mb: 2.5,
                border: `3px solid ${morkBorgColors.pink}`,
                position: 'relative',
                '&::before': {
                    content: '"SCROLLS & POWERS"',
                    position: 'absolute',
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
            }}
        >
            {scrolls.map((scroll, index) => (
                <PowerRow
                    key={scroll.key ?? index}
                    number={index + 1}
                    powerKey={scroll.key ?? ''}
                    name={scroll.name ?? 'Unknown Scroll'}
                    description={scroll.description}
                    uses={[false, false, false]}
                    onToggleUse={() => {
                    }}
                />
            ))}
        </Paper>
    );
}
