import { Box, styled } from "@mui/material";
import { morkBorgColors, customStyles } from "@theme/morkBorgTheme";

export const BoneIconContainer = styled(Box)({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    position: "relative"
});

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

export const StyledNavLink = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'fullWidth',
})<StyledNavLinkProps>(({ isActive, fullWidth }) => ({
    ...customStyles.navLink.base,
    width: fullWidth ? '100%' : 100,
    ...(isActive ? customStyles.navLink.active : customStyles.navLink.inactive),
    '&:hover': customStyles.navLink.hover,
}));
