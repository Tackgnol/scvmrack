import {useSnackbar} from "@/SnackbarContext/SnackbarProvider.tsx";
import { Alert, Button, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSessionStatus } from "@/hooks/useSessionStatus";

import { customStyles } from "@theme/morkBorgTheme";

interface Props {
    onSignUpClick: () => void;
}

export function SessionWarningBanner({ onSignUpClick }: Props) {
    const { t } = useTranslation();
    const { showWarning, daysUntilExpiry, canExtend, extend, isExtending } = useSessionStatus();
    const { showSuccess, showError } = useSnackbar();

    if (!showWarning) return null;

    const handleExtend = async () => {
        try {
            await extend();
            showSuccess(t("session.extended"));
        } catch (err) {
            showError(err instanceof Error ? err.message : t("session.extendFailed"));
        }
    };

    const daysText = daysUntilExpiry === 1
        ? t("session.expiresWarning_one", { count: 1 })
        : t("session.expiresWarning", { days: daysUntilExpiry });

    return (
        <Alert severity="warning" sx={customStyles.sessionWarning.alert}>
            <span>{daysText}</span>
            <Box sx={customStyles.sessionWarning.buttonContainer}>
                <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={onSignUpClick}
                    sx={customStyles.sessionWarning.signUpButton}
                >
                    {t("session.signUpKeepForever")}
                </Button>
                {canExtend && (
                    <Button
                        color="inherit"
                        size="small"
                        onClick={handleExtend}
                        disabled={isExtending}
                    >
                        {isExtending ? "..." : t("session.extend7Days")}
                    </Button>
                )}
            </Box>
        </Alert>
    );
}
