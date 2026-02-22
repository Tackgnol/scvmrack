import { useCallback, useState } from 'react';

interface UseTurnstileChallengeOptions {
    enabled: boolean;
    onMissingToken?: () => void;
}

export function useTurnstileChallenge({
    enabled,
    onMissingToken,
}: UseTurnstileChallengeOptions) {
    const [token, setToken] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const onTokenChange = useCallback((nextToken: string | null) => {
        setToken(nextToken);
    }, []);

    const reset = useCallback(() => {
        setToken(null);
        setResetSignal((prev) => prev + 1);
    }, []);

    const ensureToken = useCallback((): boolean => {
        if (!enabled) {
            return true;
        }

        if (!token) {
            onMissingToken?.();
            return false;
        }

        return true;
    }, [enabled, token, onMissingToken]);

    return {
        token,
        resetSignal,
        onTokenChange,
        reset,
        ensureToken,
    };
}
