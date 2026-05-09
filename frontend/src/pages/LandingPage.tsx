import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

const s = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-start',
        bgcolor: morkBorgColors.black,
        px: { xs: 2, sm: 4, md: 6 },
        pt: { xs: 8, sm: 12 },
        pb: { xs: 10, sm: 14 },
    },
    stamp: {
        display: 'inline-block',
        fontFamily: '"MedievalSharp", serif',
        fontSize: '0.7rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
        px: 2,
        py: 0.5,
        mb: 5,
    },
    hero: {
        maxWidth: 660,
        width: '100%',
        mb: { xs: 6, sm: 8 },
    },
    kicker: {
        fontFamily: '"MedievalSharp", serif',
        color: morkBorgColors.yellow,
        fontSize: '0.8rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase' as const,
        mb: 2.5,
    },
    headline: {
        fontFamily: '"MedievalSharp", serif',
        color: morkBorgColors.white,
        fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' },
        lineHeight: 1.08,
        mb: 3,
        fontWeight: 'normal',
    },
    lede: {
        color: 'rgba(255, 255, 255, 0.68)',
        fontSize: { xs: '0.95rem', sm: '1.05rem' },
        lineHeight: 1.7,
        mb: 4.5,
        maxWidth: 500,
    },
    ctaRow: {
        flexDirection: 'row' as const,
        gap: 2,
        flexWrap: 'wrap' as const,
        mb: { xs: 8, sm: 10 },
    },
    ctaPrimary: {
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
        borderRadius: 0,
        fontFamily: '"MedievalSharp", serif',
        fontSize: '0.95rem',
        textTransform: 'uppercase' as const,
        px: 3.5,
        py: 1.25,
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
        '&:hover': {
            bgcolor: morkBorgColors.yellow,
            boxShadow: `4px 4px 0 ${morkBorgColors.pink}`,
        },
    },
    ctaSecondary: {
        bgcolor: 'transparent',
        color: morkBorgColors.yellow,
        borderRadius: 0,
        fontFamily: '"MedievalSharp", serif',
        fontSize: '0.95rem',
        textTransform: 'uppercase' as const,
        px: 3.5,
        py: 1.25,
        border: `3px solid ${morkBorgColors.yellow}`,
        boxShadow: `4px 4px 0 ${morkBorgColors.yellow}`,
        '&:hover': {
            bgcolor: morkBorgColors.yellow,
            color: morkBorgColors.black,
            boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
        },
    },
    noticeGrid: {
        maxWidth: 900,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 0.85fr' },
        gap: { xs: 2, sm: 2.5 },
    },
    noticeCard: {
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `4px 4px 0 ${morkBorgColors.black}`,
        bgcolor: '#0f0f0f',
        p: { xs: 2.5, sm: 3 },
    },
    noticeNum: {
        fontFamily: '"MedievalSharp", serif',
        color: morkBorgColors.pink,
        fontSize: '2rem',
        lineHeight: 1,
        mb: 1.5,
    },
    noticeTitle: {
        fontFamily: '"MedievalSharp", serif',
        color: morkBorgColors.yellow,
        fontSize: '1rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        mb: 1,
    },
    noticeBody: {
        color: 'rgba(255, 255, 255, 0.62)',
        fontSize: '0.875rem',
        lineHeight: 1.7,
    },
};

const notices = [
    {
        title: 'Bring the book',
        num: '01',
        body: `You need MÖRK BORG to play. This tracks what happens when you do — stats, wounds, Omens, and everything else your scvm is about to lose.`,
    },
    {
        num: '02',
        title: 'One scvm per guest',
        body: `Guests get one character. Generate a new one and the old one is gone. Sign up — it’s free — to keep as many doomed wretches as you like.`,
    },
    {
        num: '03',
        title: 'Mark them dead',
        body: `Characters don’t last long at the end of the world. When yours falls, mark them deceased. Their record stays. A warning to whoever comes next.`,
    },
];

export function LandingPage() {
    return (
        <Box sx={s.page}>
            <Stack alignItems="flex-start" sx={{ width: '100%' }}>
                <Box component="span" sx={s.stamp}>
                    Fan made · Non-commercial
                </Box>

                <Box sx={s.hero}>
                    <Typography sx={s.kicker}>
                        MÖRK BORG character sheet
                    </Typography>

                    <Typography component="h1" sx={s.headline}>
                        Roll them up. Watch them die. Keep the record.
                    </Typography>

                    <Typography sx={s.lede}>
                        Stats, wounds, Omens, and gear — tracked automatically as you play.
                        Free, with no login required to start.
                    </Typography>

                    <Stack sx={s.ctaRow}>
                        <Button component={Link} to="/character" sx={s.ctaPrimary}>
                            Open your sheet
                        </Button>
                        <Button
                            component="a"
                            href="https://morkborg.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={s.ctaSecondary}
                        >
                            Get the sourcebook
                        </Button>
                    </Stack>
                </Box>

                <Box sx={s.noticeGrid}>
                    {notices.map((n) => (
                        <Box key={n.num} sx={s.noticeCard}>
                            <Typography sx={s.noticeNum}>{n.num}</Typography>
                            <Typography sx={s.noticeTitle}>{n.title}</Typography>
                            <Typography sx={s.noticeBody}>{n.body}</Typography>
                        </Box>
                    ))}
                </Box>
            </Stack>
        </Box>
    );
}
