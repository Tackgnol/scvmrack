import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Box, Button } from '@mui/material';
import { keyframes } from '@mui/system';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Seo } from '@/seo/Seo';
import skeleton from '@/assets/skeleton-404.png';

const swing = keyframes`
    0%   { transform: rotate(-3deg) translateY(0); }
    50%  { transform: rotate(3deg)  translateY(-4px); }
    100% { transform: rotate(-3deg) translateY(0); }
`;

const flicker = keyframes`
    0%, 92%, 100% { opacity: 1; }
    93%           { opacity: 0.4; }
    95%           { opacity: 1; }
    96%           { opacity: 0.6; }
`;

interface NotFoundPageProps {
    homeLinkMode?: 'router' | 'anchor';
    heading?: string;
    tagline?: string;
    stamp?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoPath?: string;
    seoNoIndex?: boolean;
}

export function NotFoundPage({
    homeLinkMode = 'router',
    heading: headingOverride,
    tagline: taglineOverride,
    stamp: stampOverride,
    seoTitle = '404 — Lost in the doom',
    seoDescription = 'This page has rotted away. Crawl back to the rack.',
    seoPath = '/404',
    seoNoIndex = false,
}: NotFoundPageProps) {
    const { t } = useTranslation();

    const heading = headingOverride ?? t('notFound.title', '404');
    const tagline = taglineOverride ?? t('notFound.tagline', 'Go back, mate.');
    const stamp = stampOverride ?? t('notFound.stamp', 'Page Not Found');
    const ctaLabel = `« ${t('common.backToHome', 'Back to Home')}`;
    const ctaSx = {
        mt: { xs: 3, md: 4 },
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: { xs: '1.35rem', md: '1.5rem' },
        letterSpacing: '0.18em',
        px: 3,
        py: 1.25,
        borderRadius: 0,
        border: `3px solid ${morkBorgColors.black}`,
        boxShadow: `6px 6px 0 ${morkBorgColors.black}`,
        transform: 'rotate(-1.5deg)',
        transition: 'transform 160ms ease-out, box-shadow 160ms ease-out',
        '&:hover': {
            bgcolor: morkBorgColors.yellow,
            transform: 'rotate(-2.5deg) translate(-2px, -2px)',
            boxShadow: `9px 9px 0 ${morkBorgColors.black}`,
        },
        '&:active': {
            transform: 'rotate(-1deg) translate(3px, 3px)',
            boxShadow: `2px 2px 0 ${morkBorgColors.black}`,
        },
    } as const;

    return (
        <>
            <Seo
                title={seoTitle}
                description={seoDescription}
                path={seoPath}
                noIndex={seoNoIndex}
            />

            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: { xs: '70vh', md: '78vh' },
                    mt: { xs: 2, md: 4 },
                    border: `4px solid ${morkBorgColors.black}`,
                    bgcolor: morkBorgColors.pink,
                    boxShadow: `10px 10px 0 ${morkBorgColors.black}`,
                    px: { xs: 3, sm: 5, md: 7 },
                    py: { xs: 4, md: 6 },
                    clipPath: {
                        xs: 'polygon(0 0, 100% 4%, 100% 100%, 0 96%)',
                        md: 'polygon(0 0, 100% 6%, 100% 100%, 0 94%)',
                    },
                }}
            >
                {/* Black wedge — top left corner */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: { xs: 120, md: 220 },
                        height: { xs: 120, md: 220 },
                        bgcolor: morkBorgColors.black,
                        clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Black wedge — bottom right corner */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: { xs: 140, md: 280 },
                        height: { xs: 140, md: 240 },
                        bgcolor: morkBorgColors.black,
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Yellow accent slash — top right */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        top: { xs: -10, md: -20 },
                        right: { xs: -30, md: -40 },
                        width: { xs: 180, md: 320 },
                        height: { xs: 22, md: 30 },
                        bgcolor: morkBorgColors.yellow,
                        transform: 'rotate(-18deg)',
                        border: `3px solid ${morkBorgColors.black}`,
                        pointerEvents: 'none',
                    }}
                />

                {/* Diagonal SVG noise streaks for grit */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        opacity: 0.18,
                        mixBlendMode: 'multiply',
                        backgroundImage: `repeating-linear-gradient(
                            115deg,
                            transparent 0 6px,
                            ${morkBorgColors.black} 6px 7px
                        )`,
                    }}
                />

                {/* Content grid */}
                <Box
                    sx={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr' },
                        alignItems: 'center',
                        gap: { xs: 4, md: 2 },
                        height: '100%',
                        minHeight: { xs: '60vh', md: '64vh' },
                    }}
                >
                    {/* LEFT — Type column */}
                    <Box sx={{ position: 'relative', zIndex: 2 }}>
                        {/* Stamp */}
                        <Box
                            sx={{
                                display: 'inline-block',
                                bgcolor: morkBorgColors.black,
                                color: morkBorgColors.yellow,
                                fontFamily: "'Antonio', sans-serif",
                                fontSize: { xs: '0.95rem', md: '1.05rem' },
                                letterSpacing: '0.32em',
                                textTransform: 'uppercase',
                                px: 1.25,
                                py: 0.5,
                                border: `2px solid ${morkBorgColors.yellow}`,
                                boxShadow: `4px 4px 0 ${morkBorgColors.yellow}`,
                                transform: 'rotate(-2deg)',
                                mb: { xs: 2, md: 3 },
                            }}
                        >
                            {stamp}
                        </Box>

                        {/* 404 — layered offset print */}
                        <Box
                            component="h1"
                            sx={{
                                position: 'relative',
                                m: 0,
                                lineHeight: 0.85,
                                fontFamily: "'Bebas Neue', 'Antonio', sans-serif",
                                fontWeight: 700,
                                fontSize: 'clamp(6.5rem, 28vw, 17rem)',
                                letterSpacing: '-0.02em',
                                color: morkBorgColors.black,
                                animation: `${flicker} 6s infinite`,
                            }}
                        >
                            {/* Yellow ghost layer */}
                            <Box
                                component="span"
                                aria-hidden
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    color: morkBorgColors.yellow,
                                    transform: 'translate(10px, 10px)',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                }}
                            >
                                {heading}
                            </Box>
                            {/* Main black layer */}
                            <Box
                                component="span"
                                sx={{ position: 'relative', zIndex: 1 }}
                            >
                                {heading}
                            </Box>
                        </Box>

                        {/* Tagline */}
                        <Box
                            component="p"
                            sx={{
                                m: 0,
                                mt: { xs: 3, md: 4 },
                                fontFamily: "'MedievalSharp', serif",
                                fontSize: 'clamp(2.4rem, 9vw, 3rem)',
                                color: morkBorgColors.black,
                                lineHeight: 1.05,
                                maxWidth: '20ch',
                                textShadow: `3px 3px 0 ${morkBorgColors.yellow}`,
                            }}
                        >
                            {tagline}
                        </Box>

                        {/* CTA */}
                        {homeLinkMode === 'anchor' ? (
                            <Button
                                component="a"
                                href="/"
                                disableRipple
                                sx={ctaSx}
                            >
                                {ctaLabel}
                            </Button>
                        ) : (
                            <Button
                                component={Link}
                                to="/"
                                disableRipple
                                sx={ctaSx}
                            >
                                {ctaLabel}
                            </Button>
                        )}
                    </Box>

                    {/* RIGHT — Skeleton */}
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: { xs: 'center', md: 'flex-end' },
                            alignItems: 'flex-end',
                            zIndex: 1,
                            alignSelf: 'stretch',
                        }}
                    >
                        <Box
                            component="img"
                            src={skeleton}
                            alt=""
                            aria-hidden
                            sx={{
                                width: { xs: 200, sm: 260, md: '100%' },
                                maxWidth: { md: 360 },
                                height: 'auto',
                                transformOrigin: 'top center',
                                animation: `${swing} 4.2s ease-in-out infinite`,
                                filter: `drop-shadow(6px 6px 0 ${morkBorgColors.black})`,
                                '@media (prefers-reduced-motion: reduce)': {
                                    animation: 'none',
                                },
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </>
    );
}
