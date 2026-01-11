import {useCurrentCharacter} from "@/hooks/useCurrentCharacter.ts";
import { createContext, useContext, ReactNode } from 'react';

const CharacterContext = createContext<ReturnType<typeof useCurrentCharacter> | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
    const character = useCurrentCharacter();
    return (
        <CharacterContext.Provider value={character}>
            {children}
        </CharacterContext.Provider>
    );
}

export function useCharacter() {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within CharacterProvider');
    }
    return context;
}
