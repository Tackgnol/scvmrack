import {useCharacter} from "@/CharacterContext/CharacterContext.tsx";
import {
    Box,
    ClickAwayListener,
    Divider,
    Fade,
    Paper,
    Popper,
    Typography,
} from '@mui/material';
import { CharacterResponse, type ComputedModifier, type CustomModifier, type Statistic } from "@/hooks/models.ts";
import { customStyles, morkBorgColors, statColors } from '../theme/morkBorgTheme';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {useTranslation} from 'react-i18next';
import AnimatedNumber from './AnimatedNumber';
import { statToModifier } from '@/utils/stats.ts';

type SummaryDetailKey = 'dodge' | 'melee' | 'ranged' | 'encumbrance';
type CombatContext = 'defence' | 'melee' | 'ranged';

type DecoratedModifier = (ComputedModifier | CustomModifier) & {
    listKey: string;
};

interface SummaryStatProps {
    label: string;
    children: ReactNode;
    isActive: boolean;
    onHoverOpen: (element: HTMLElement) => void;
    onHoverClose: () => void;
    onPinToggle: (element: HTMLElement) => void;
}

const SummaryStat = ({
    label,
    children,
    isActive,
    onHoverOpen,
    onHoverClose,
    onPinToggle,
}: SummaryStatProps) => (
    <Box
        component="button"
        type="button"
        onMouseEnter={(event) => onHoverOpen(event.currentTarget)}
        onMouseLeave={onHoverClose}
        onFocus={(event) => onHoverOpen(event.currentTarget)}
        onBlur={onHoverClose}
        onClick={(event) => onPinToggle(event.currentTarget)}
        aria-expanded={isActive}
        aria-haspopup="dialog"
        sx={{
            ...customStyles.summaryStat,
            cursor: 'help',
            width: '100%',
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            backgroundColor: isActive ? 'rgba(255, 233, 0, 0.07)' : 'transparent',
            transition: 'background-color 140ms ease, box-shadow 140ms ease',
            '&:hover': {
                backgroundColor: 'rgba(255, 233, 0, 0.09)',
                boxShadow: `inset 0 0 0 1px ${morkBorgColors.pink}`,
            },
            '&:focus-visible': {
                outline: `2px dashed ${morkBorgColors.pink}`,
                outlineOffset: -3,
            },
        }}
    >
        <Typography variant="subtitle2" color="secondary" sx={customStyles.summaryStatLabel}>
            {label}
        </Typography>
        {children}
    </Box>
);

const formatSigned = (value: number): string => {
    if (value > 0) return `+${value}`;
    return `${value}`;
};

const getModifierName = (
    modifier: DecoratedModifier,
    fallbackLabel: string,
): string => {
    if ('originName' in modifier && modifier.originName) return modifier.originName;
    if ('name' in modifier && modifier.name) return modifier.name;
    if (modifier.source) return modifier.source;
    return fallbackLabel;
};

const getAccentColor = (detail: SummaryDetailKey): string => {
    if (detail === 'dodge') return statColors.agi;
    if (detail === 'melee') return statColors.str;
    if (detail === 'ranged') return statColors.pre;
    return morkBorgColors.yellow;
};

export default function SummaryBar() {
    const { character } = useCharacter();
    const {t} = useTranslation();
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [activeDetail, setActiveDetail] = useState<SummaryDetailKey | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isPinned, setIsPinned] = useState(false);

    // Use DR values from backend (calculated with all modifiers)
    // Cast to any since the schema might not have these fields yet
    const char = character as CharacterResponse | undefined;
    const unknownOriginLabel = t('modifiers.computed.unknownOrigin');
    const allModifiers: DecoratedModifier[] = [
        ...(character?.computedModifiers ?? []).map((modifier, index) => ({
            ...modifier,
            listKey: `computed-${modifier.originKey ?? index}`,
        })),
        ...(character?.modifiers ?? []).map((modifier, index) => ({
            ...modifier,
            listKey: `custom-${modifier.id ?? index}`,
        })),
    ];

    const getCombatBreakdown = (stat: Statistic, context: CombatContext) => {
        const applicable = allModifiers.filter((modifier) => {
            if ((modifier.value ?? 0) === 0) return false;
            if (modifier.statistic !== stat) return false;
            return !(modifier.exclude ?? []).includes(context);
        });

        const modifierTotal = applicable.reduce((sum, modifier) => sum + (modifier.value ?? 0), 0);
        return { applicable, modifierTotal };
    };

    const agilityValue = character?.agility ?? 10;
    const strengthValue = character?.strength ?? 10;
    const presenceValue = character?.presence ?? 10;
    const agilityModifier = statToModifier(agilityValue);
    const strengthModifier = statToModifier(strengthValue);
    const presenceModifier = statToModifier(presenceValue);

    const dodgeBreakdown = getCombatBreakdown('agility', 'defence');
    const meleeBreakdown = getCombatBreakdown('strength', 'melee');
    const rangedBreakdown = getCombatBreakdown('presence', 'ranged');

    const encumbranceItems = character?.equipment ?? [];
    const encumbrance = char?.encumbrance ?? encumbranceItems.length;
    const maxEncumbrance = char?.maxEncumbrance ?? 8;
    const toDodge = char?.drToDodge ?? 12 - agilityModifier - dodgeBreakdown.modifierTotal;
    const toHitMelee = char?.drToMelee ?? 12 - strengthModifier - meleeBreakdown.modifierTotal;
    const toHitRanged = char?.drToRanged ?? 12 - presenceModifier - rangedBreakdown.modifierTotal;
    const characterKey = character?.id ?? 'unknown';

    const clearCloseTimer = () => {
        if (closeTimerRef.current !== null) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const closeNow = () => {
        clearCloseTimer();
        setActiveDetail(null);
        setAnchorEl(null);
        setIsPinned(false);
    };

    const scheduleClose = () => {
        if (isPinned) return;
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setActiveDetail(null);
            setAnchorEl(null);
            setIsPinned(false);
        }, 140);
    };

    const openHoverDetail = (detail: SummaryDetailKey, element: HTMLElement) => {
        if (isPinned && activeDetail !== detail) return;
        clearCloseTimer();
        setActiveDetail(detail);
        setAnchorEl(element);
    };

    const togglePinnedDetail = (detail: SummaryDetailKey, element: HTMLElement) => {
        clearCloseTimer();
        if (isPinned && activeDetail === detail) {
            closeNow();
            return;
        }

        setActiveDetail(detail);
        setAnchorEl(element);
        setIsPinned(true);
    };

    useEffect(() => {
        return () => {
            clearCloseTimer();
        };
    }, []);

    const renderCombatBreakdown = (
        title: string,
        stat: Statistic,
        abilityModifier: number,
        currentDr: number,
        breakdown: ReturnType<typeof getCombatBreakdown>,
    ) => {
        const abilityContribution = -abilityModifier;
        const modifiersContribution = -breakdown.modifierTotal;

        return (
            <Box>
            <Typography
                sx={{
                    fontFamily: "'Antonio', sans-serif",
                    letterSpacing: '0.11em',
                    textTransform: 'uppercase',
                    color: morkBorgColors.yellow,
                    fontSize: '0.72rem',
                    mb: 0.8,
                }}
            >
                {title}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0.4, mb: 1.1 }}>
                <Typography sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem' }}>
                    Base DR
                </Typography>
                <Typography sx={{ color: morkBorgColors.white, fontFamily: "'Bebas Neue', sans-serif" }}>
                    12
                </Typography>

                <Typography sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem' }}>
                    {t(`attributes.${stat}`)} mod
                </Typography>
                <Typography sx={{ color: morkBorgColors.white, fontFamily: "'Bebas Neue', sans-serif" }}>
                    {formatSigned(abilityContribution)}
                </Typography>

                <Typography sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem' }}>
                    {t('modifiers.title')}
                </Typography>
                <Typography sx={{ color: morkBorgColors.white, fontFamily: "'Bebas Neue', sans-serif" }}>
                    {formatSigned(modifiersContribution)}
                </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 62, 181, 0.4)', mb: 0.95 }} />

            <Typography
                sx={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.04rem',
                    color: morkBorgColors.yellow,
                    letterSpacing: '0.06em',
                    mb: 0.75,
                }}
            >
                DR {currentDr}
            </Typography>

            {breakdown.applicable.length === 0 ? (
                <Typography
                    sx={{
                        color: 'rgba(245,245,245,0.66)',
                        fontStyle: 'italic',
                        fontSize: '0.78rem',
                    }}
                >
                    {t('modifiers.noModifiers')}
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45 }}>
                    {breakdown.applicable.map((modifier) => (
                        <Box
                            key={modifier.listKey}
                            sx={{
                                px: 0.7,
                                py: 0.4,
                                border: `1px solid ${morkBorgColors.darkGrey}`,
                                bgcolor: 'rgba(10,10,10,0.78)',
                                display: 'grid',
                                gridTemplateColumns: '1fr auto',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Typography
                                sx={{
                                    color: morkBorgColors.white,
                                    fontSize: '0.74rem',
                                    lineHeight: 1.15,
                                    fontFamily: "'Antonio', sans-serif",
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {getModifierName(modifier, unknownOriginLabel)}
                            </Typography>
                            <Typography
                                sx={{
                                    color: (modifier.value ?? 0) >= 0 ? morkBorgColors.yellow : morkBorgColors.pink,
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: '0.94rem',
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {formatSigned(modifier.value ?? 0)}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
        );
    };

    const renderEncumbranceBreakdown = () => (
        <Box>
            <Typography
                sx={{
                    fontFamily: "'Antonio', sans-serif",
                    letterSpacing: '0.11em',
                    textTransform: 'uppercase',
                    color: morkBorgColors.yellow,
                    fontSize: '0.72rem',
                    mb: 0.8,
                }}
            >
                {t('stats.encumbrance')}
            </Typography>

            <Typography sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem', mb: 0.95 }}>
                {encumbrance} / {maxEncumbrance}
            </Typography>

            <Divider sx={{ borderColor: 'rgba(255, 62, 181, 0.4)', mb: 0.95 }} />

            {encumbranceItems.length === 0 ? (
                <Typography
                    sx={{
                        color: 'rgba(245,245,245,0.66)',
                        fontStyle: 'italic',
                        fontSize: '0.78rem',
                    }}
                >
                    {t('equipment.none')}
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45, maxHeight: 220, overflowY: 'auto', pr: 0.4 }}>
                    {encumbranceItems.map((item, index) => (
                        <Box
                            key={`${item.key ?? 'enc-item'}-${index}`}
                            sx={{
                                px: 0.7,
                                py: 0.4,
                                border: `1px solid ${morkBorgColors.darkGrey}`,
                                bgcolor: 'rgba(10,10,10,0.78)',
                            }}
                        >
                            <Typography
                                sx={{
                                    color: morkBorgColors.white,
                                    fontSize: '0.74rem',
                                    lineHeight: 1.15,
                                    fontFamily: "'Antonio', sans-serif",
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {item.name?.trim() || item.key || t('character.unknown')}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );

    const popperOpen = Boolean(activeDetail && anchorEl);
    const popperAccent = activeDetail ? getAccentColor(activeDetail) : morkBorgColors.yellow;

    return (
        <Paper sx={customStyles.summaryBarPaper}>
            <SummaryStat
                label={t('stats.toDodge')}
                isActive={activeDetail === 'dodge'}
                onHoverOpen={(element) => openHoverDetail('dodge', element)}
                onHoverClose={scheduleClose}
                onPinToggle={(element) => togglePinnedDetail('dodge', element)}
            >
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={toDodge} cacheKey={`${characterKey}:summary:dodge`} durationMs={340} />
                </Typography>
            </SummaryStat>

            <SummaryStat
                label={t('stats.toHitMelee')}
                isActive={activeDetail === 'melee'}
                onHoverOpen={(element) => openHoverDetail('melee', element)}
                onHoverClose={scheduleClose}
                onPinToggle={(element) => togglePinnedDetail('melee', element)}
            >
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={toHitMelee} cacheKey={`${characterKey}:summary:melee`} durationMs={340} />
                </Typography>
            </SummaryStat>

            <SummaryStat
                label={t('stats.toHitRanged')}
                isActive={activeDetail === 'ranged'}
                onHoverOpen={(element) => openHoverDetail('ranged', element)}
                onHoverClose={scheduleClose}
                onPinToggle={(element) => togglePinnedDetail('ranged', element)}
            >
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={toHitRanged} cacheKey={`${characterKey}:summary:ranged`} durationMs={340} />
                </Typography>
            </SummaryStat>

            <SummaryStat
                label={t('stats.encumbrance')}
                isActive={activeDetail === 'encumbrance'}
                onHoverOpen={(element) => openHoverDetail('encumbrance', element)}
                onHoverClose={scheduleClose}
                onPinToggle={(element) => togglePinnedDetail('encumbrance', element)}
            >
                <Typography variant="h3" color="primary">
                    <AnimatedNumber value={encumbrance} cacheKey={`${characterKey}:summary:encumbrance`} durationMs={320} />
                    {' / '}
                    <AnimatedNumber value={maxEncumbrance} cacheKey={`${characterKey}:summary:max-encumbrance`} durationMs={320} />
                </Typography>
            </SummaryStat>

            <Popper
                open={popperOpen}
                anchorEl={anchorEl}
                placement="top"
                transition
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 10],
                        },
                    },
                ]}
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
            >
                {({ TransitionProps }) => (
                    <ClickAwayListener onClickAway={closeNow}>
                        <Fade {...TransitionProps} timeout={150}>
                            <Paper
                                onMouseEnter={clearCloseTimer}
                                onMouseLeave={scheduleClose}
                                sx={{
                                    width: { xs: 270, sm: 315 },
                                    maxWidth: 'calc(100vw - 20px)',
                                    px: 1.25,
                                    py: 1.15,
                                    borderRadius: 0,
                                    bgcolor: '#060606',
                                    color: morkBorgColors.white,
                                    border: `2px solid ${popperAccent}`,
                                    borderTopWidth: 4,
                                    boxShadow: `6px 6px 0 ${morkBorgColors.black}, 0 0 0 1px ${morkBorgColors.pink}`,
                                    backgroundImage: `linear-gradient(165deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 65%), linear-gradient(0deg, rgba(255,233,0,0.06), rgba(255,233,0,0.01))`,
                                }}
                            >
                                {activeDetail === 'dodge' &&
                                    renderCombatBreakdown(
                                        t('stats.toDodge'),
                                        'agility',
                                        agilityModifier,
                                        toDodge,
                                        dodgeBreakdown,
                                    )}
                                {activeDetail === 'melee' &&
                                    renderCombatBreakdown(
                                        t('stats.toHitMelee'),
                                        'strength',
                                        strengthModifier,
                                        toHitMelee,
                                        meleeBreakdown,
                                    )}
                                {activeDetail === 'ranged' &&
                                    renderCombatBreakdown(
                                        t('stats.toHitRanged'),
                                        'presence',
                                        presenceModifier,
                                        toHitRanged,
                                        rangedBreakdown,
                                    )}
                                {activeDetail === 'encumbrance' && renderEncumbranceBreakdown()}
                            </Paper>
                        </Fade>
                    </ClickAwayListener>
                )}
            </Popper>
        </Paper>
    );
}
