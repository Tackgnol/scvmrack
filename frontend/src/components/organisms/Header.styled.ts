import { Box, styled } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { morkBorgColors, customStyles } from "@theme/morkBorgTheme";

export const BoneIconContainer = styled(Box)({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    position: "relative"
});

export const ScvmCountBadge = styled(Box)(({ theme }) => ({
    backgroundColor: morkBorgColors.pink,
    color: morkBorgColors.black,
    padding: '0px 8px',
    fontSize: '0.75rem',
    fontWeight: 900,
    fontFamily: '"Oswald", "Helvetica Neue", Arial, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: `2px solid ${morkBorgColors.black}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 0px ${morkBorgColors.yellow}`,
    transform: 'rotate(-2deg)',
    whiteSpace: 'nowrap',
    marginRight: '8px',
    marginLeft: '8px',
    height: '24px',
    [theme.breakpoints.down('md')]: {
        fontSize: '0.65rem',
        padding: '0px 6px',
        boxShadow: `2px 2px 0px ${morkBorgColors.yellow}`,
        marginRight: '4px',
        marginLeft: '4px',
        height: '20px',
    }
}));

interface BoneBarProps {
    index: number;
    isOpen: boolean;
}

export const BoneBar = styled(Box)<BoneBarProps>(({ index, isOpen }) => ({
    height: "6px",
    width: (index === 2 && !isOpen) ? "24px" : "32px",
    backgroundColor: morkBorgColors.white,
    borderRadius: "4px",
    position: "absolute",
    left: (index === 2 && !isOpen) ? "4px" : "0px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    top: index === 1 ? (isOpen ? "13px" : "4px") :
        index === 2 ? "13px" :
            (isOpen ? "13px" : "22px"),
    transform: index === 1 && isOpen ? "rotate(45deg)" :
        index === 3 && isOpen ? "rotate(-45deg)" : "none",
    opacity: index === 2 && isOpen ? 0 : 1,
    "&::before, &::after": {
        content: '""',
        position: "absolute",
        width: "8px",
        height: "8px",
        backgroundColor: morkBorgColors.white,
        borderRadius: "50%",
        top: "-1px",
    },
    "&::before": { left: "-4px" },
    "&::after": { right: "-4px" },
}));

interface StyledNavLinkProps {
    isActive: boolean;
    fullWidth?: boolean;
}

export const StyledNavLink = styled(Link, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'fullWidth',
})<StyledNavLinkProps>(({ isActive, fullWidth }) => ({
    ...customStyles.navLink.base,
    width: fullWidth ? '100%' : 'auto',
    transitionProperty: 'box-shadow, color, border-color, background-color, opacity, transform',
    transitionDuration: '180ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    backfaceVisibility: 'hidden',
    opacity: isActive ? 1 : 0.93,
    ...(isActive ? customStyles.navLink.active : customStyles.navLink.inactive),
    '&:hover': {
        ...customStyles.navLink.hover,
        opacity: 1,
        backgroundColor: '#151515',
    },
    '&:active': {
        transform: isActive ? customStyles.navLink.active.transform : customStyles.navLink.inactive.transform,
        boxShadow: isActive ? `2px 2px 0 ${morkBorgColors.pink}` : `1px 1px 0 ${morkBorgColors.black}`,
    },
    '&:focus-visible': {
        opacity: 1,
        outline: `2px solid ${morkBorgColors.yellow}`,
        outlineOffset: 2,
    },
    '@media (prefers-reduced-motion: reduce)': {
        transitionDuration: '0ms',
    },
}));
