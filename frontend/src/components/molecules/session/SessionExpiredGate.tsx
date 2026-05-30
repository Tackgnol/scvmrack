import { Typography } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MorkBorgModal, { ModalButton } from '@components/molecules/modal/MorkBorgModal';
import { loginUrl } from '@/auth';
import { useSessionExpiredFlag } from '@/hooks/useSessionExpiredFlag';
import { getLastAuthKind } from '@/preferences/lastAuthKind';
import { CHARACTER_ID_QUERY_PARAM, clearCurrentSearchParam } from '@/router/navigation';

/**
 * Recovers from an expired session. The auth middleware flips the `expired`
 * flag in the URL on a persistent 401; this gate is the only place that reacts
 * to it for the user:
 *   - Guests (anonymous, or unknown) self-heal silently — we drop the flag and
 *     any stale character id so `useAuth` bootstraps a fresh guest session and
 *     the app lands on a clean home. Nothing the guest could "recover" is lost
 *     that re-authenticating would bring back.
 *   - Real accounts get a modal: sign in again to get their characters back, or
 *     fall back to a guest session.
 *
 * Rendered once at the layout root so it also catches expiry on a hard reload
 * (the flag is in the URL), which the previous code left as a permanent dead-end.
 */
export function SessionExpiredGate() {
    const { t } = useTranslation();
    const { isSessionExpired, clearSessionExpiredFlag } = useSessionExpiredFlag();
    const wasAccount = getLastAuthKind() === 'account';

    useEffect(() => {
        if (!isSessionExpired || wasAccount) {
            return;
        }

        // Sequential, awaited replaces — each reads the current params fresh, so
        // clearing the stale id and the flag won't clobber one another.
        void (async () => {
            await clearCurrentSearchParam(CHARACTER_ID_QUERY_PARAM);
            await clearSessionExpiredFlag();
        })();
    }, [isSessionExpired, wasAccount, clearSessionExpiredFlag]);

    if (!isSessionExpired || !wasAccount) {
        return null;
    }

    return (
        <MorkBorgModal
            open
            onClose={() => void clearSessionExpiredFlag()}
            title={t('errors.unauthorizedTitle', 'Session expired')}
            closeOnBackdrop={false}
            showCloseButton={false}
            actions={
                <>
                    <ModalButton
                        variant="secondary"
                        onClick={() => void clearSessionExpiredFlag()}
                    >
                        {t('errors.continueAsGuest', 'Continue as guest')}
                    </ModalButton>
                    <ModalButton
                        variant="primary"
                        onClick={() => {
                            window.location.href = loginUrl();
                        }}
                    >
                        {t('errors.signInAgain', 'Sign in')}
                    </ModalButton>
                </>
            }
        >
            <Typography>
                {t('errors.unauthorized', 'Your session expired. Sign in again.')}
            </Typography>
        </MorkBorgModal>
    );
}

export default SessionExpiredGate;
