import {useCharacterEditor} from "@/hooks/useCharacterEditor.ts";
import {useCharacterId} from "@/hooks/useCharacterId.ts";
import {useCharacterRepository} from "@/hooks/useCharacterRepository.ts";
import {getStoredLocale, setStoredLocale} from "@/hooks/utils.ts";
import {useCallback, useEffect, useState} from "react";

export function useCurrentCharacter() {
    const {characterId, setCharacterId} = useCharacterId();
    const [locale, setLocale] = useState<'en' | 'pl'>(getStoredLocale() ??'en');
    const repo = useCharacterRepository(characterId, locale);

    const editor = useCharacterEditor(
        characterId,
        repo.updateCharacter,
        repo.getCharacterKey,
        locale
    );

    useEffect(() => {
        if (!characterId && !repo.createCharacter.isPending) {
            repo.createCharacter.mutate({
                body: {},
                params: {query: {locale}}
            });
        }
    }, [characterId, repo.createCharacter, locale]);

    useEffect(() => {
        const character = repo.createCharacter.data;
        if (character?.id) {
            setCharacterId(character.id);
        }
    }, [repo.createCharacter.data, setCharacterId]);

    const generateNewCharacter = useCallback(
        (classId?: number) => {
            editor.flush();
            const id = classId ?? Math.floor(Math.random() * (6 - 1 + 1)) + 1;


            repo.createCharacter.mutate({
                body: {class_id: id},
                params: {query: {locale}}
            });
        },
        [editor, repo.createCharacter, locale]
    );

    const changeLocale = useCallback(
        (newLocale: 'en' | 'pl') => {
            if (newLocale === locale) return;
            setLocale(newLocale);
            setStoredLocale(locale);
        },
        [locale]
    );

    return {
        characterId,
        character: repo.character,
        error: repo.error,
        isLoading: repo.isLoading || repo.createCharacter.isPending,
        locale,

        setCharacterId,
        changeLocale,
        generateNew: generateNewCharacter,
        ...editor,
        flushUpdates: editor.flush
    };
}
