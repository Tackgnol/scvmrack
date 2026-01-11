import {Flag} from "@components/Flag.tsx";
import {FlagContainer} from "@components/FlagContainer.tsx";
import {Box, Paper, Typography} from "@mui/material";
import {morkBorgColors} from "@theme/morkBorgTheme.ts";


export default function Header() {
    return (
        <Paper
            sx={{
                p: 2.5,
                mb: 2.5,
                transform: 'rotate(-0.5deg)',
                position: 'relative',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 20,
                    right: 20,
                    height: 8,
                    bgcolor: 'secondary.main',
                },
            }}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <Box sx={{flex: 1}}>
                    <Typography
                        variant="h1"
                        sx={{
                            color: morkBorgColors.yellow,
                            fontSize: 'clamp(2.5rem, 10vw, 5rem)',
                            '& span': {color: morkBorgColors.pink},
                        }}
                    >
                        Sc<span>v</span>m G<span>r</span>inder
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{color: morkBorgColors.white, letterSpacing: '0.5em', mt: 1}}
                    >
                        Character Sheet
                    </Typography>
                </Box>
                <FlagContainer>
                    <Flag locale="en"/>
                    <Flag locale="pl"/>
                </FlagContainer>

            </Box>
        </Paper>
    );
}
