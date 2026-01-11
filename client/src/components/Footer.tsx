import {Box, Button, Paper, Typography} from "@mui/material";
import {morkBorgColors} from "@theme/morkBorgTheme.ts";

interface FooterProps {
    onOpenModal: () => void;
    onGenerateNew: () => void;
}

export default function Footer({onOpenModal, onGenerateNew}: FooterProps) {
    return (
        <Paper sx={{textAlign: 'center', p: 3}}>
            <Typography
                variant="h3"
                sx={{
                    color: morkBorgColors.yellow,
                    letterSpacing: '0.3em',
                    '& span': {color: morkBorgColors.pink},
                }}
            >
                The <span>World</span> Is <span>Ending</span>
            </Typography>
            <Box sx={{display: 'flex', gap: 2, justifyContent: 'center', mt: 2}}>
                <Button
                    onClick={onGenerateNew}
                    sx={{
                        bgcolor: morkBorgColors.pink,
                        border: `2px solid ${morkBorgColors.black}`,
                        color: morkBorgColors.black,
                        fontFamily: "'Antonio', sans-serif",
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        '&:hover': {
                            bgcolor: morkBorgColors.yellow,
                        },
                    }}
                >
                    Generate New
                </Button>
                <Button
                    onClick={onOpenModal}
                    sx={{
                        bgcolor: morkBorgColors.grey,
                        border: `2px solid ${morkBorgColors.yellow}`,
                        color: morkBorgColors.yellow,
                        fontFamily: "'Antonio', sans-serif",
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        '&:hover': {
                            bgcolor: morkBorgColors.yellow,
                            color: morkBorgColors.black,
                        },
                    }}
                >
                    Test Modal
                </Button>
            </Box>
        </Paper>
    );
}
