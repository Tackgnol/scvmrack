import { authKeys } from '@/api';
import { obrAuthClient } from '@/auth/obrAuthClient';
import { useAuth } from '@/hooks/useAuth';
import { appHistory } from '@/router/history';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Message, Wrapper } from './ObrAuthDonePage.styles';

const FAILURE_MESSAGE =
    'This link has expired or was already used. Go back to Owlbear and try again.';
const ACCOUNT_MISMATCH_MESSAGE =
    'This browser tab is already signed into an account. Sign out here before opening the Owlbear forge link.';

function scrubToken(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function ObrOpenPage() {
    const { isAnonymous, isLoading, user } = useAuth({ bootstrapAnonymous: false });
    const queryClient = useQueryClient();
    const started = useRef(false);
    const [failureMessage, setFailureMessage] = useState<string | null>(null);

    useEffect(() => {
        if (started.current || isLoading) return;
        started.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token')?.trim();
        const to = params.get('to')?.trim();
        const characterId = params.get('character')?.trim();
        const obrRoomId = params.get('obrRoom')?.trim();
        const obrPlayerId = params.get('obrPlayer')?.trim();
        const forge = to === 'forge';

        if (!token || (forge ? !obrRoomId || !obrPlayerId : !characterId)) {
            if (token) scrubToken();
            setFailureMessage(FAILURE_MESSAGE);
            return;
        }

        if (user && !isAnonymous) {
            scrubToken();
            setFailureMessage(ACCOUNT_MISMATCH_MESSAGE);
            return;
        }

        void (async () => {
            try {
                await obrAuthClient.redeemObrExchangeToken(token);
                scrubToken();
                await queryClient.invalidateQueries({ queryKey: authKeys.session() });
                const destination = forge
                    ? `/character/create?obrRoom=${encodeURIComponent(obrRoomId as string)}&obrPlayer=${encodeURIComponent(obrPlayerId as string)}`
                    : `/character/${encodeURIComponent(characterId as string)}`;
                await appHistory.replace(destination);
            } catch {
                scrubToken();
                setFailureMessage(FAILURE_MESSAGE);
            }
        })();
    }, [isAnonymous, isLoading, queryClient, user]);

    return (
        <Wrapper>
            <Message>{failureMessage ?? 'Opening your scvm…'}</Message>
        </Wrapper>
    );
}
