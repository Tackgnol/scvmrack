import {getStoredCharacterId, setStoredCharacterId} from "@/hooks/utils.ts";
import {useCallback, useState} from "react";

export function useCharacterId() {
    const [characterId, setCharacterIdState] = useState<string | null>(() =>
        getStoredCharacterId()
    );

    const setCharacterId = useCallback((id: string | null) => {
        setCharacterIdState(id);
        setStoredCharacterId(id);
    }, []);

    return { characterId, setCharacterId };
}
