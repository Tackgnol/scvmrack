import {useAuth} from "@/hooks/useAuth";
import {useCurrentCharacter} from "@/hooks/useCurrentCharacter";
import { useSessionExpiredFlag } from '@/hooks/useSessionExpiredFlag';
import {Flag} from "@components/Flag";
import {FlagContainer} from "@components/FlagContainer";
import {AuthModal} from "@components/index";
import {LoggedOutBanner} from "@components/LoggedOutBanner";
import {SessionWarningBanner} from "@components/SessionWarningBanner";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import PersonIcon from "@mui/icons-material/Person";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SyncIcon from "@mui/icons-material/Sync";
import {Box, Chip, Drawer, IconButton, Paper, Typography, useMediaQuery, useTheme} from "@mui/material";
import { useRouterState} from "@tanstack/react-router";
import {customStyles} from "@theme/morkBorgTheme";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import { BoneIconContainer, BoneBar, StyledNavLink } from "./Header.styled";

// --- The Dynamic Bone Icon (Hamburger to X) ---
const BoneIcon = ({isOpen}: { isOpen: boolean }) => (
    <BoneIconContainer sx={customStyles.boneIconGap(isOpen)}>
        {[1, 2, 3].map((i) => (
            <BoneBar key={i} index={i} isOpen={isOpen} />
        ))}
    </BoneIconContainer>
);

function NavLink({to, text, onClick, fullWidth}: {
    to: string;
    text: string;
    onClick?: () => void;
    fullWidth?: boolean
}) {
    const routerState = useRouterState();
    const isActive = routerState.location.pathname === to;

    return (
        <StyledNavLink
            to={to}
            onClick={onClick}
            isActive={isActive}
            fullWidth={fullWidth}
        >
            {text}
        </StyledNavLink>
    );
}

export default function Header() {
    const {t} = useTranslation();
    const {user, isAuthenticated} = useAuth();
    const {isSaving, isJustLoggedOut, generateNew, character} = useCurrentCharacter();
    const { isSessionExpired, clearSessionExpiredFlag } = useSessionExpiredFlag();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
            if (localStorage.getItem('pending-claim-character-id')) {
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

    const getStatusChip = () => {
        if (isSaving) return (
            <Chip
                size="small"
                icon={<SyncIcon sx={customStyles.header.syncIcon}/>}
                label={t("status.saving")}
                variant="outlined"
                sx={customStyles.header.savingChip}
            />
        );
        return (
            <Chip
                size="small"
                icon={<CloudDoneIcon/>}
                label={t("status.synced")}
                color="success"
                variant="outlined"
                sx={customStyles.statusChip.common}
            />
        );
    };

    return (
        <>
            <SessionWarningBanner onSignUpClick={() => openAuthModal()}/>
            {isJustLoggedOut && !character && <LoggedOutBanner onCreateCharacter={() => generateNew()}/>}

            <Paper sx={customStyles.header.paper}>
                <Box sx={customStyles.header.container(isMobile)}>
                    <Box sx={customStyles.header.titleBox}>
                        <Typography variant="h1" sx={customStyles.header.title(isMobile)}>
                            Sc<span>v</span>m G<span>r</span>inder
                        </Typography>
                        <Typography variant="subtitle1" sx={customStyles.header.subtitle(isMobile)}>
                            {t("app.subtitle")}
                        </Typography>
                    </Box>

                    {isMobile ? (
                        <Box sx={customStyles.header.mobileMenuButton}>
                            <IconButton onClick={() => setMobileMenuOpen(true)}>
                                <BoneIcon isOpen={false}/>
                            </IconButton>
                        </Box>
                    ) : (
                        <Box sx={customStyles.header.desktopNav}>
                            <Box sx={customStyles.header.topBar}>
                                {getStatusChip()}
                                <FlagContainer><Flag locale="en"/><Flag locale="pl"/></FlagContainer>
                                <IconButton onClick={() => openAuthModal()} sx={customStyles.header.authButton}>
                                    {isAuthenticated ? <PersonIcon/> : <PersonOutlineIcon/>}
                                </IconButton>
                            </Box>
                            <Box sx={customStyles.header.navBar}>
                                <NavLink to="/" text={t("nav.home")}/>
                                {isAuthenticated && <NavLink to="/characters" text={t("nav.characters")}/>}
                                <NavLink to="/faq" text={t("nav.faq")}/>
                                <NavLink to="/release" text={t("nav.release")}/>
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
                        <BoneIcon isOpen={true}/>
                    </IconButton>
                </Box>

                <Box sx={customStyles.header.drawerNav}>
                    <NavLink to="/" text={t("nav.home")} fullWidth onClick={() => setMobileMenuOpen(false)}/>
                    {isAuthenticated && <NavLink to="/characters" text={t("nav.characters")} fullWidth
                                                 onClick={() => setMobileMenuOpen(false)}/>}
                    <NavLink to="/faq" text={t("nav.faq")} fullWidth onClick={() => setMobileMenuOpen(false)}/>
                    <NavLink to="/release" text={t("nav.release")} fullWidth onClick={() => setMobileMenuOpen(false)}/>
                </Box>

                <Box sx={customStyles.header.drawerFooter}>
                    <Box sx={customStyles.header.drawerStatusBox}>{getStatusChip()}</Box>
                    <Box sx={customStyles.header.drawerAuthBox}>
                        <FlagContainer><Flag locale="en"/><Flag locale="pl"/></FlagContainer>
                        <IconButton onClick={() => {
                            openAuthModal();
                            setMobileMenuOpen(false);
                        }} sx={customStyles.header.drawerAuthButton}>
                            {isAuthenticated ? <PersonIcon fontSize="large"/> : <PersonOutlineIcon fontSize="large"/>}
                        </IconButton>
                    </Box>
                </Box>
            </Drawer>

            <AuthModal
                open={authModalOpen}
                onClose={closeAuthModal}
                sessionExpiredNotice={sessionExpiredNotice}
            />
        </>
    );
}
