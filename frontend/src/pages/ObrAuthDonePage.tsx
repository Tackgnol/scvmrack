import { issueObrExchangeToken } from '@/auth';
import { useEffect, useState } from 'react';
import { Message, Wrapper } from './ObrAuthDonePage.styles';

// Popup callback after Logto sign-in. Running here means we are first-party and
// authenticated, so we can mint a one-time obr-exchange token, hand it to the
// opener (the OBR iframe) via postMessage, and close. The iframe redeems it to
// adopt this identity into its partition. See useObrSession + the shared-auth
// obr-exchange capability.
export function ObrAuthDonePage() {
    const [failed, setFailed] = useState(false);

    // ponytail: one-shot mint-on-mount-then-close — a throwaway popup callback,
    // not a query. The fetch lives in the auth module (issueObrExchangeToken);
    // .catch keeps throw out of the effect (React Compiler rejects throw here).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const token = await issueObrExchangeToken().catch(() => null);

            if (token && window.opener && !window.opener.closed) {
                window.opener.postMessage(
                    { type: 'obr-exchange-token', token },
                    window.location.origin
                );
                window.close();
                return;
            }
            if (!cancelled) setFailed(true);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Wrapper>
            <Message>
                {failed
                    ? 'Sign-in could not be handed back. You can close this window and try again.'
                    : 'Finishing sign-in…'}
            </Message>
        </Wrapper>
    );
}
