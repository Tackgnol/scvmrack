import { useAuth } from "@/hooks/useAuth";
import { useCharacter } from "@/CharacterContext/CharacterContext";
import { useSessionExpiredFlag } from '@/hooks/useSessionExpiredFlag';
import { appHistory } from '@/router/history';
import { buildHomeCallbackUrl, getCurrentPendingClaimCharacterId } from '@/router/navigation';
import { Flag } from "@components/Flag";
import { FlagContainer } from "@components/FlagContainer";
import { SessionWarningBanner } from "@components/SessionWarningBanner";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import PersonIcon from "@mui/icons-material/Person";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SyncIcon from "@mui/icons-material/Sync";
import { Box, Chip, Drawer, IconButton, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useRouterState } from "@tanstack/react-router";
import { customStyles } from "@theme/morkBorgTheme";
import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BoneIconContainer, BoneBar, StyledNavLink } from "./Header.styled";

const AuthModal = lazy(() => import('./AuthModal').then(m => ({ default: m.AuthModal })));

// --- The Dynamic Bone Icon (Hamburger to X) ---
const BoneIcon = ({ isOpen }: { isOpen: boolean }) => (
    <BoneIconContainer sx={customStyles.boneIconGap(isOpen)}>
        {[1, 2, 3].map((i) => (
            <BoneBar key={i} index={i} isOpen={isOpen} />
        ))}
    </BoneIconContainer>
);

function NavLink({ to, href, text, onClick, fullWidth }: {
    to: string;
    href?: string;
    text: string;
    onClick?: () => void;
    fullWidth?: boolean
}) {
    const routerState = useRouterState();
    const isActive = routerState.location.pathname === to;

    const handleClick = href ? (e: React.MouseEvent) => {
        e.preventDefault();
        onClick?.();
        void appHistory.push(href);
    } : onClick;

    return (
        <StyledNavLink
            to={to}
            onClick={handleClick}
            isActive={isActive}
            fullWidth={fullWidth}
            data-testid={`nav-link-${to.replace(/\//g, '') || 'home'}`}
        >
            {text}
        </StyledNavLink>
    );
}

export default function Header() {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const { isSaving, isJustLoggedOut, character, characterId } = useCharacter();
    const { isSessionExpired, clearSessionExpiredFlag } = useSessionExpiredFlag();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showSaving, setShowSaving] = useState(false);
    const savingShowTimeoutRef = useRef<number | null>(null);
    const savingHideTimeoutRef = useRef<number | null>(null);
    const savingVisibleSinceRef = useRef<number | null>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const homeUrl = buildHomeCallbackUrl(characterId);

    const openAuthModal = useCallback((showSessionExpiredNotice = false) => {
        setSessionExpiredNotice(showSessionExpiredNotice);
        setAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setAuthModalOpen(false);
        setSessionExpiredNotice(false);
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.emailVerified) {
            if (getCurrentPendingClaimCharacterId()) {
                openAuthModal();
            }
        }
    }, [isAuthenticated, openAuthModal, user?.emailVerified]);

    useEffect(() => {
        if (!isSessionExpired) {
            return;
        }

        if (!isAuthenticated) {
            openAuthModal(true);
        }
        void clearSessionExpiredFlag();
    }, [clearSessionExpiredFlag, isAuthenticated, isSessionExpired, openAuthModal]);

    // Automatically open modal if just logged out without a character
    useEffect(() => {
        if (isJustLoggedOut && !character && !authModalOpen) {
            openAuthModal();
        }
    }, [isJustLoggedOut, character, authModalOpen, openAuthModal]);

    useEffect(() => {
        const SHOW_DELAY_MS = 140;
        const MIN_VISIBLE_MS = 420;

        if (isSaving) {
            if (!showSaving && savingShowTimeoutRef.current === null) {
                savingShowTimeoutRef.current = window.setTimeout(() => {
                    setShowSaving(true);
                    savingVisibleSinceRef.current = Date.now();
                    savingShowTimeoutRef.current = null;
                }, SHOW_DELAY_MS);
            }
        } else {
            if (savingShowTimeoutRef.current !== null) {
                window.clearTimeout(savingShowTimeoutRef.current);
                savingShowTimeoutRef.current = null;
            }
            if (showSaving) {
                const elapsed = Date.now() - (savingVisibleSinceRef.current ?? Date.now());
                const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
                savingHideTimeoutRef.current = window.setTimeout(() => {
                    setShowSaving(false);
                    savingVisibleSinceRef.current = null;
                    savingHideTimeoutRef.current = null;
                }, remaining);
            }
        }

        return () => {
            if (savingShowTimeoutRef.current !== null) {
                window.clearTimeout(savingShowTimeoutRef.current);
                savingShowTimeoutRef.current = null;
            }
            if (savingHideTimeoutRef.current !== null) {
                window.clearTimeout(savingHideTimeoutRef.current);
                savingHideTimeoutRef.current = null;
            }
        };
    }, [isSaving, showSaving]);

    const getStatusChip = () => {
        if (showSaving) return (
            <Chip
                size="small"
                icon={<SyncIcon sx={customStyles.header.syncIcon} />}
                label={t("status.saving")}
                variant="outlined"
                sx={customStyles.header.savingChip}
            />
        );
        return (
            <Chip
                size="small"
                icon={<CloudDoneIcon />}
                label={t("status.synced")}
                color="success"
                variant="outlined"
                sx={customStyles.statusChip.common}
            />
        );
    };

    return (
        <>
            <SessionWarningBanner onSignUpClick={() => openAuthModal()} />

            <Paper data-testid="app-title" sx={customStyles.header.paper}>
                <Box sx={customStyles.header.container(isMobile)}>
                    <Box sx={customStyles.header.titleBox}>
                        <Typography variant="h1" sx={customStyles.header.title(isMobile)}>
                            SC<span>V</span>M
                        </Typography>
                        <Typography sx={customStyles.header.titleSecondLine(isMobile)}>
                            RACK
                        </Typography>
                        <Typography variant="subtitle1" sx={customStyles.header.subtitle(isMobile)}>
                            {t("app.subtitle")}
                        </Typography>
                    </Box>

                    {isMobile ? (
                        <Box sx={customStyles.header.mobileMenuButton}>
                            <IconButton onClick={() => setMobileMenuOpen(true)}>
                                <BoneIcon isOpen={false} />
                            </IconButton>
                        </Box>
                    ) : (
                        <Box sx={customStyles.header.desktopNav}>
                            <Box sx={customStyles.header.topBar}>
                                {getStatusChip()}
                                <FlagContainer><Flag locale="en" /><Flag locale="pl" /></FlagContainer>
                                <IconButton data-testid="auth-button" onClick={() => openAuthModal()} sx={customStyles.header.authButton}>
                                    {isAuthenticated ? <PersonIcon /> : <PersonOutlineIcon />}
                                </IconButton>
                            </Box>
                            <Box sx={customStyles.header.navBar}>
                                <NavLink to="/" href={homeUrl} text={t("nav.home")} />
                                {isAuthenticated && <NavLink to="/characters" text={t("nav.characters")} />}
                                <NavLink to="/faq" text={t("nav.faq")} />
                                <NavLink to="/release" text={t("nav.release")} />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                slotProps={{
                    paper: {
                        sx: {
                            ...customStyles.drawer.paper,
                            ...customStyles.header.drawerPaper,
                        },
                    },
                }}
            >
                <Box sx={customStyles.header.drawerHeader}>
                    <Typography variant="h4" sx={customStyles.header.drawerTitle}>
                        THE VAULT
                    </Typography>
                    <IconButton onClick={() => setMobileMenuOpen(false)}>
                        <BoneIcon isOpen={true} />
                    </IconButton>
                </Box>

                <Box sx={customStyles.header.drawerNav}>
                    <NavLink to="/" href={homeUrl} text={t("nav.home")} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    {isAuthenticated && <NavLink to="/characters" text={t("nav.characters")} fullWidth
                        onClick={() => setMobileMenuOpen(false)} />}
                    <NavLink to="/faq" text={t("nav.faq")} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/release" text={t("nav.release")} fullWidth onClick={() => setMobileMenuOpen(false)} />
                </Box>

                <Box sx={customStyles.header.drawerFooter}>
                    <Box sx={customStyles.header.drawerStatusBox}>{getStatusChip()}</Box>
                    <Box sx={customStyles.header.drawerAuthBox}>
                        <FlagContainer><Flag locale="en" /><Flag locale="pl" /></FlagContainer>
                        <IconButton onClick={() => {
                            openAuthModal();
                            setMobileMenuOpen(false);
                        }} sx={customStyles.header.drawerAuthButton}>
                            {isAuthenticated ? <PersonIcon fontSize="large" /> : <PersonOutlineIcon fontSize="large" />}
                        </IconButton>
                    </Box>
                </Box>
            </Drawer>

            <Suspense fallback={null}>
                <AuthModal
                    open={authModalOpen}
                    onClose={closeAuthModal}
                    sessionExpiredNotice={sessionExpiredNotice}
                />
            </Suspense>
        </>
    );
}
