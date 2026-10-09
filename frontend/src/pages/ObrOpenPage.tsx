import { authKeys } from '@/api';
import { signOut } from '@/auth';
import { obrAuthClient } from '@/auth/obrAuthClient';
import { useAuth } from '@/hooks/useAuth';
import { appHistory } from '@/router/history';
import { Button, Stack } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Message, Wrapper } from './ObrAuthDonePage.styles';

const FAILURE_MESSAGE =
    'This link has expired or was already used. Go back to Owlbear and try again.';
const ACCOUNT_MISMATCH_MESSAGE =
    'This browser tab is already signed into a different account.';

type ForgeHandoff = { token: string; roomId: string; playerId: string };

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
    const [mismatch, setMismatch] = useState<ForgeHandoff | null>(null);
    const [switching, setSwitching] = useState(false);

    const openForge = useCallback(async ({ token, roomId, playerId }: ForgeHandoff) => {
        await obrAuthClient.redeemObrExchangeToken(token);
        scrubToken();
        await queryClient.invalidateQueries({ queryKey: authKeys.session() });
        await appHistory.replace(
            `/character/create?obrRoom=${encodeURIComponent(roomId)}&obrPlayer=${encodeURIComponent(playerId)}`,
        );
    }, [queryClient]);

    useEffect(() => {
        if (started.current || isLoading) return;
        started.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token')?.trim();
        const to = params.get('to')?.trim();
        const characterId = params.get('character')?.trim();
        const roomId = params.get('obrRoom')?.trim();
        const playerId = params.get('obrPlayer')?.trim();
        const forge = to === 'forge';

        if (!token || (forge ? !roomId || !playerId : !characterId)) {
            if (token) scrubToken();
            setFailureMessage(FAILURE_MESSAGE);
            return;
        }

        if (forge && user && !isAnonymous) {
            setMismatch({ token, roomId, playerId });
            return;
        }

        void (async () => {
            try {
                if (forge) {
                    await openForge({ token, roomId: roomId as string, playerId: playerId as string });
                    return;
                }
                await obrAuthClient.redeemObrExchangeToken(token);
                scrubToken();
                await queryClient.invalidateQueries({ queryKey: authKeys.session() });
                await appHistory.replace(`/character/${encodeURIComponent(characterId as string)}`);
            } catch {
                scrubToken();
                setFailureMessage(FAILURE_MESSAGE);
            }
        })();
    }, [isAnonymous, isLoading, openForge, queryClient, user]);

    const forgeAsObrIdentity = async () => {
        if (!mismatch || switching) return;
        setSwitching(true);
        try {
            await signOut();
            await openForge(mismatch);
            setMismatch(null);
        } catch {
            scrubToken();
            setMismatch(null);
            setFailureMessage(FAILURE_MESSAGE);
        } finally {
            setSwitching(false);
        }
    };

    if (mismatch) {
        return (
            <Wrapper>
                <Stack spacing={2} alignItems="center">
                    <Message>{ACCOUNT_MISMATCH_MESSAGE}</Message>
                    <Button variant="contained" onClick={() => void forgeAsObrIdentity()} disabled={switching}>
                        Forge as the Owlbear identity
                    </Button>
                    <Button variant="text" onClick={() => { scrubToken(); setMismatch(null); setFailureMessage('Opening cancelled. Go back to Owlbear and try again.'); }}>
                        Cancel
                    </Button>
                </Stack>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Message>{failureMessage ?? 'Opening your scvm…'}</Message>
        </Wrapper>
    );
}