import { useState, useCallback, useEffect } from "react";

const CHARACTER_ID_KEY = "mork-borg-character-id";

function getStoredCharacterId(): string | null {
    try {
        return localStorage.getItem(CHARACTER_ID_KEY);
    } catch {
        return null;
    }
}

function setStoredCharacterId(id: string | null) {
    try {
        if (id) {
            localStorage.setItem(CHARACTER_ID_KEY, id);
        } else {
            localStorage.removeItem(CHARACTER_ID_KEY);
        }
    } catch {}
}

export function useCharacterId() {
    const [characterId, setCharacterIdState] = useState<string | null>(() =>
        getStoredCharacterId()
    );

    const setCharacterId = useCallback((id: string | null) => {
        setCharacterIdState(id);
        setStoredCharacterId(id);
    }, []);

    // Sync with localStorage on mount (in case another tab changed it)
    useEffect(() => {
        const stored = getStoredCharacterId();
        if (stored !== characterId) {
            setCharacterIdState(stored);
        }
    }, []);

    return {
        characterId,
        setCharacterId
    };
}
