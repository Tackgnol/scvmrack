import {appHistory} from '@/router/history';
import {getCurrentCharacterIdParam, setCurrentCharacterIdParam} from '@/router/navigation';
import {useCallback, useEffect, useState} from 'react';

export function useCharacterId() {
    const [characterId, setInternalCharacterId] = useState<string | null>(() => getCurrentCharacterIdParam());

    useEffect(() => {
        return appHistory.subscribe(() => {
            const nextId = getCurrentCharacterIdParam();
            setInternalCharacterId(nextId);
        });
    }, []);

    const setCharacterId = useCallback(async (id: string | null) => {
        if (id === characterId) {
            return;
        }
        await setCurrentCharacterIdParam(id);
    }, [characterId]);

    return {
        characterId,
        setCharacterId
    };
}
