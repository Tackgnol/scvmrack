import {appHistory} from '@/router/history';
import {getCurrentCharacterIdParam, setCurrentCharacterIdParam} from '@/router/navigation';
import {
    readRememberedCharacterId,
    writeRememberedCharacterId,
} from '@/preferences/lastCharacter';
import {useCallback, useEffect, useRef, useState} from 'react';

export function useCharacterId() {
    const [characterId, setInternalCharacterId] = useState<string | null>(() => getCurrentCharacterIdParam());
    const [lastCharacterId, setLastCharacterId] = useState<string | null>(() => {
        const current = getCurrentCharacterIdParam();
        return current || readRememberedCharacterId();
    });
    const characterIdRef = useRef(characterId);

    useEffect(() => {
        return appHistory.subscribe(() => {
            const nextId = getCurrentCharacterIdParam();
            if (characterIdRef.current !== nextId) {
                characterIdRef.current = nextId;
                setInternalCharacterId(nextId);
            }
            if (nextId) {
                setLastCharacterId((previousId) => {
                    if (previousId === nextId) return previousId;
                    writeRememberedCharacterId(nextId);
                    return nextId;
                });
            }
        });
    }, []);

    const setCharacterId = useCallback(async (id: string | null) => {
        if (id === characterIdRef.current) {
            return;
        }
        characterIdRef.current = id;
        setInternalCharacterId(id);
        setLastCharacterId(id);
        writeRememberedCharacterId(id);
        await setCurrentCharacterIdParam(id);
    }, []);

    return {
        characterId,
        lastCharacterId,
        setCharacterId
    };
}
