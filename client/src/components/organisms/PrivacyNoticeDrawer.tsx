import { setAnalyticsEnabled } from '@/analytics/googleAnalytics';
import {
    getPrivacySettings,
    isAnalyticsAllowed,
    savePrivacySettings,
    type PrivacySettings,
} from '@/privacy/privacySettings';
import { subscribeOpenPrivacyDrawer } from '@/privacy/privacyDrawerBus';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { Box, Button, Divider, Drawer, FormControlLabel, Switch, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PRIVACY_DRAWER_WIDTH = 390;

export function PrivacyNoticeDrawer() {
    const { t } = useTranslation();
    const [savedSettings, setSavedSettings] = useState<PrivacySettings>(() => getPrivacySettings());
    const [analyticsEnabled, setAnalyticsEnabledPreference] = useState<boolean>(
        savedSettings.analyticsEnabled
    );
    const [open, setOpen] = useState<boolean>(() => !savedSettings.acknowledged);

    const isFirstNotice = useMemo(() => !savedSettings.acknowledged, [savedSettings.acknowledged]);
    const legalSections: string[] = [
        t('privacy.sections.storage'),
        t('privacy.sections.backend'),
        t('privacy.sections.analytics'),
        t('privacy.sections.sensitiveData'),
    ];

    const closeDrawer = () => {
        if (isFirstNotice) {
            return;
        }

        setOpen(false);
    };

    useEffect(() => {
        return subscribeOpenPrivacyDrawer(() => {
            const current = getPrivacySettings();
            setSavedSettings(current);
            setAnalyticsEnabledPreference(current.analyticsEnabled);
            setOpen(true);
        });
    }, []);

    const savePreferences = () => {
        const nextSettings: PrivacySettings = {
            acknowledged: true,
            analyticsEnabled,
        };

        savePrivacySettings(nextSettings);
        setSavedSettings(nextSettings);
        setAnalyticsEnabled(isAnalyticsAllowed(nextSettings));
        setOpen(false);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={closeDrawer}
            ModalProps={{
                disableEscapeKeyDown: isFirstNotice,
            }}
            slotProps={{
                paper: {
                    sx: {
                        width: { xs: '100%', sm: PRIVACY_DRAWER_WIDTH },
                        maxWidth: '100%',
                        bgcolor: morkBorgColors.black,
                        color: morkBorgColors.white,
                        borderLeft: `4px solid ${morkBorgColors.yellow}`,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    },
                },
            }}
        >
            <Box>
                <Typography
                    variant="h4"
                    sx={{
                        color: morkBorgColors.yellow,
                        fontFamily: '"MedievalSharp", serif',
                        lineHeight: 1.05,
                    }}
                >
                    {t('privacy.title')}
                </Typography>
                <Typography
                    sx={{
                        mt: 0.5,
                        color: morkBorgColors.pink,
                        fontFamily: '"Antonio", sans-serif',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontSize: '0.78rem',
                    }}
                >
                    {t('privacy.subtitle')}
                </Typography>
            </Box>

            <Divider sx={{ borderColor: `${morkBorgColors.pink}99` }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {legalSections.map((section) => (
                    <Typography key={section} variant="body2" sx={{ lineHeight: 1.5 }}>
                        {section}
                    </Typography>
                ))}
            </Box>

            <Divider sx={{ borderColor: `${morkBorgColors.yellow}66` }} />

            <FormControlLabel
                data-testid="privacy-drawer-analytics-toggle"
                control={
                    <Switch
                        checked={analyticsEnabled}
                        onChange={(event) => setAnalyticsEnabledPreference(event.target.checked)}
                        color="secondary"
                        inputProps={{ 'data-testid': 'analytics-switch' } as any}
                    />
                }
                label={
                    <Typography sx={{ color: morkBorgColors.white }}>
                        {t('privacy.analyticsToggle')}
                    </Typography>
                }
                sx={{
                    alignItems: 'flex-start',
                    m: 0,
                    '& .MuiFormControlLabel-label': { mt: 0.25 },
                }}
            />

            <Typography variant="caption" sx={{ color: '#d0d0d0' }}>
                {analyticsEnabled
                    ? t('privacy.analyticsEnabledState')
                    : t('privacy.analyticsDisabledState')}
            </Typography>
            <Typography variant="caption" sx={{ color: morkBorgColors.yellow }}>
                {t('privacy.consentConfirmation', {
                    action: isFirstNotice
                        ? t('privacy.actions.initialSave')
                        : t('privacy.actions.savePreferences'),
                })}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', pt: 1 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={savePreferences}
                    data-testid="privacy-drawer-save-button"
                    sx={{
                        backgroundColor: morkBorgColors.pink,
                        color: morkBorgColors.black,
                        '&:hover': { backgroundColor: morkBorgColors.yellow },
                    }}
                >
                    {isFirstNotice
                        ? t('privacy.actions.initialSave')
                        : t('privacy.actions.savePreferences')}
                </Button>
                {!isFirstNotice && (
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={closeDrawer}
                        data-testid="privacy-drawer-close-button"
                        sx={{
                            borderColor: morkBorgColors.yellow,
                            color: morkBorgColors.yellow,
                        }}
                    >
                        {t('privacy.actions.close')}
                    </Button>
                )}
            </Box>
        </Drawer>
    );
}
