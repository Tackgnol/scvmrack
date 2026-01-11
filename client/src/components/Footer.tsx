import {Box, Button, Paper, Typography} from "@mui/material";
import {customStyles} from "@theme/morkBorgTheme.ts";
import {Trans, useTranslation} from 'react-i18next';

interface FooterProps {
    onGenerateNew: () => void;
}

export default function Footer({onGenerateNew}: FooterProps) {
    const {t} = useTranslation();

    return (
        <Paper sx={customStyles.footer.paper}>
            <Typography variant="h3" sx={customStyles.footer.title}>
                <Trans i18nKey="footer.worldEnding">
                    The <span>World</span> Is <span>Ending</span>
                </Trans>
            </Typography>
            <Box sx={customStyles.footer.buttonContainer}>
                <Button onClick={onGenerateNew} sx={customStyles.footerButton}>
                    {t('actions.generateNew')}
                </Button>
            </Box>
        </Paper>
    );
}
