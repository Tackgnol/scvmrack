import { Alert, Button } from "@mui/material";
import { clearCurrentSearchParam, LOGGED_OUT_QUERY_PARAM } from '@/router/navigation';
import { useTranslation } from "react-i18next";
import { customStyles } from "@theme/morkBorgTheme";

interface Props {
    onCreateCharacter: () => void;
}

export function LoggedOutBanner({ onCreateCharacter }: Props) {
    const { t } = useTranslation();

    const handleCreate = async () => {
        await clearCurrentSearchParam(LOGGED_OUT_QUERY_PARAM);
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
