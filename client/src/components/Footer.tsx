import {Box, Button, Paper, Typography} from "@mui/material";
import { requestOpenPrivacyDrawer } from '@/privacy/privacyDrawerBus';
import {customStyles} from "@theme/morkBorgTheme.ts";
import {Trans, useTranslation} from 'react-i18next';

interface FooterProps {
    onGenerateNew: () => void;
}

export default function Footer({onGenerateNew}: FooterProps) {
    const {t} = useTranslation();

    const handleOpenPrivacy = () => {
        requestOpenPrivacyDrawer();
    };

    return (
        <Paper sx={customStyles.footer.paper}>
            <Typography variant="h3" sx={customStyles.footer.title}>
                <Trans i18nKey="footer.worldEnding">
                    The <span>World</span> Is <span>Ending</span>
                </Trans>
            </Typography>
            <Box sx={customStyles.footer.buttonContainer}>
                <Button data-testid="generate-new-button" onClick={onGenerateNew} sx={customStyles.footerButton}>
                    {t('actions.generateNew')}
                </Button>
            </Box>
            <Typography
                variant="caption"
                sx={{
                    display: 'block',
                    mt: 2,
                    color: 'rgba(245,245,245,0.8)',
                    lineHeight: 1.6,
                }}
            >
                <Trans
                    i18nKey="footer.legalNotice"
                    components={{
                        privacyLink: (
                            <Box
                                component="button"
                                type="button"
                                onClick={handleOpenPrivacy}
                                sx={{
                                    ml: 0.5,
                                    p: 0,
                                    border: 0,
                                    bgcolor: 'transparent',
                                    color: 'secondary.main',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    font: 'inherit',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            />
                        ),
                    }}
                />
            </Typography>
        </Paper>
    );
}
