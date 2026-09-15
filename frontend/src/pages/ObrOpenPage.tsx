import { authKeys } from '@/api';
import { obrAuthClient } from '@/auth/obrAuthClient';
import { useAuth } from '@/hooks/useAuth';
import { appHistory } from '@/router/history';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Message, Wrapper } from './ObrAuthDonePage.styles';

const FAILURE_MESSAGE =
    'This link has expired or was already used. Go back to Owlbear and try again.';

function scrubToken(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function ObrOpenPage() {
    useAuth({ bootstrapAnonymous: false });
    const queryClient = useQueryClient();
    const started = useRef(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token')?.trim();
        const characterId = params.get('character')?.trim();

        if (!token || !characterId) {
            if (token) scrubToken();
            setFailed(true);
            return;
        }

        void (async () => {
            try {
                await obrAuthClient.redeemObrExchangeToken(token);
                scrubToken();
                await queryClient.invalidateQueries({ queryKey: authKeys.session() });
                await appHistory.replace(`/character/${encodeURIComponent(characterId)}`);
            } catch {
                scrubToken();
                setFailed(true);
            }
        })();
    }, [queryClient]);

    return (
        <Wrapper>
            <Message>{failed ? FAILURE_MESSAGE : 'Opening your scvm…'}</Message>
        </Wrapper>
    );
}
