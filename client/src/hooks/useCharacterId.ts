import {appHistory} from '@/router/history';
import {getCurrentCharacterIdParam, setCurrentCharacterIdParam} from '@/router/navigation';
import {useCallback, useEffect, useState} from 'react';

const LAST_CHARACTER_ID_STORAGE_KEY = 'last-character-id';

const readLastCharacterId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = window.localStorage.getItem(LAST_CHARACTER_ID_STORAGE_KEY);
        if (!stored) return null;
        const trimmed = stored.trim();
        return trimmed.length > 0 ? trimmed : null;
    } catch {
        return null;
    }
};

const writeLastCharacterId = (id: string | null): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (id) {
            window.localStorage.setItem(LAST_CHARACTER_ID_STORAGE_KEY, id);
        } else {
            window.localStorage.removeItem(LAST_CHARACTER_ID_STORAGE_KEY);
        }
    } catch {
        // Ignore storage errors.
    }
};

export function useCharacterId() {
    const [characterId, setInternalCharacterId] = useState<string | null>(() => getCurrentCharacterIdParam());
    const [lastCharacterId, setLastCharacterId] = useState<string | null>(() => {
        const current = getCurrentCharacterIdParam();
        return current || readLastCharacterId();
    });

    useEffect(() => {
        return appHistory.subscribe(() => {
            const nextId = getCurrentCharacterIdParam();
            setInternalCharacterId(nextId);
            if (nextId) {
                setLastCharacterId(nextId);
                writeLastCharacterId(nextId);
            }
        });
    }, []);

    const setCharacterId = useCallback(async (id: string | null) => {
        if (id === characterId) {
            return;
        }
        setInternalCharacterId(id);
        setLastCharacterId(id);
        writeLastCharacterId(id);
        await setCurrentCharacterIdParam(id);
    }, [characterId]);

    return {
        characterId,
        lastCharacterId,
        setCharacterId
    };
}
