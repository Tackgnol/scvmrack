import { appHistory } from '@/router/history';
import { getCurrentCharacterIdParam, setCurrentCharacterIdParam } from '@/router/navigation';
import { useCallback, useSyncExternalStore } from 'react';

const subscribeToHistory = (onStoreChange: () => void): (() => void) => {
    return appHistory.subscribe(() => onStoreChange());
};

const getCharacterIdSnapshot = (): string | null => {
    return getCurrentCharacterIdParam();
};

export function useCharacterId() {
    const characterId = useSyncExternalStore(
        subscribeToHistory,
        getCharacterIdSnapshot,
        () => null
    );

    const setCharacterId = useCallback((id: string | null) => {
        if (id === characterId) {
            return;
        }
        void setCurrentCharacterIdParam(id);
    }, [characterId]);

    return {
        characterId,
        setCharacterId
    };
}
