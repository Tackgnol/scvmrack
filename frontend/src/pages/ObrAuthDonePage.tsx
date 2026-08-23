import { obrAuthClient } from '@/auth/obrAuthClient';
import { completeObrAuthHandoff } from '@tackgnol/rpgtools-shared-auth/client';
import { useEffect, useState } from 'react';
import { Message, Wrapper } from './ObrAuthDonePage.styles';

// Popup callback after Logto sign-in. Running here means we are first-party
// and authenticated; shared-auth mints the one-time exchange token and hands
// it to the opener iframe (backend handoff, with postMessage/BroadcastChannel
// fallbacks), then we close.
export function ObrAuthDonePage() {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const handedOff = await completeObrAuthHandoff(obrAuthClient);
            if (handedOff) {
                window.setTimeout(() => window.close(), 50);
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
