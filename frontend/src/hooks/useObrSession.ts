import { loginUrl, redeemObrExchangeToken } from '@/auth';
import { authKeys } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';

const RETURN_TO = '/obr-auth-done';

// Session for the Owlbear Rodeo panel. `useAuth` already bootstraps an
// anonymous session and reports auth state, and its session calls already send
// `embeddedSessionHeaders()` — so inside OBR's partitioned iframe it Just Works.
// The only thing OBR adds is sign-in: the main app's top-level redirect login
// can't run in a framed context (Logto refuses to be framed), so we open a
// popup and adopt the resulting session into this partition via obr-exchange.
export function useObrSession() {
    const auth = useAuth();
    const queryClient = useQueryClient();

    const signIn = useCallback(async (): Promise<void> => {
        // loginUrl() already includes the API base.
        const popup = window.open(
            `${loginUrl()}?returnTo=${encodeURIComponent(RETURN_TO)}`,
            'scvmrack-obr-login',
            'width=480,height=720'
        );
        if (!popup) {
            // Popup blocked — caller should surface a click-to-open fallback.
            throw new Error('popup-blocked');
        }

        const token = await waitForExchangeToken(popup);
        // Adopt the just-authenticated identity into this partition. Redeem
        // LINKS the anonymous session to the account (fires shared-auth
        // onLinkAccount), so a scvm rolled while anonymous carries over.
        await redeemObrExchangeToken(token);
        await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    }, [queryClient]);

    return { ...auth, signIn };
}

// The /obr-auth-done page (running in the popup, now authenticated) posts a
// one-time exchange token back to its opener, then closes itself.
function waitForExchangeToken(popup: Window): Promise<string> {
    return new Promise((resolve, reject) => {
        // The /obr-auth-done popup is a frontend route, same origin as this
        // iframe — not the backend. It posts from window.location.origin.
        const expectedOrigin = window.location.origin;
        const timer = window.setInterval(() => {
            if (popup.closed) {
                cleanup();
                reject(new Error('popup-closed'));
            }
        }, 500);

        function onMessage(event: MessageEvent) {
            if (event.origin !== expectedOrigin) return;
            const data = event.data as { type?: string; token?: string };
            if (data?.type !== 'obr-exchange-token' || !data.token) return;
            cleanup();
            resolve(data.token);
        }

        function cleanup() {
            window.clearInterval(timer);
            window.removeEventListener('message', onMessage);
        }

        window.addEventListener('message', onMessage);
    });
}
