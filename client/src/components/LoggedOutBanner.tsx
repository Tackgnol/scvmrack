import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { customStyles } from "@theme/morkBorgTheme";

interface Props {
    onCreateCharacter: () => void;
}

export function LoggedOutBanner({ onCreateCharacter }: Props) {
    const { t } = useTranslation();

    const handleCreate = () => {
        // Clear the URL param
        window.history.replaceState({}, '', '/');
        onCreateCharacter();
    };

    return (
        <Alert severity="info" sx={customStyles.loggedOutBanner.alert}>
            <span>{t("session.loggedOut")}</span>
            <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={handleCreate}
                sx={customStyles.loggedOutBanner.button}
            >
                {t("session.createNewCharacter")}
            </Button>
        </Alert>
    );
}
