import {PathsCharactersNewPostParametersQueryLocale} from "@/api/schema.ts";
import {useAuth} from "@/hooks/useAuth.ts";
import { useCharacterEditor } from "@/hooks/useCharacterEditor.ts";
import { useCharacterId } from "@/hooks/useCharacterId.ts";
import { useCharacterRepository } from "@/hooks/useCharacterRepository.ts";
import { useSessionStatus } from "@/hooks/useSessionStatus.ts";
import {getApiLocale} from "@/hooks/utils.ts";
import {useSnackbar} from "@/SnackbarContext/SnackbarProvider.tsx";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";


export function useCurrentCharacter() {
    const { characterId, setCharacterId } = useCharacterId();
    const { i18n: { changeLanguage, language: locale } } = useTranslation();
    const trimmedLocale = getApiLocale<PathsCharactersNewPostParametersQueryLocale>(locale);
    const { showSuccess, showError } = useSnackbar();

    const isJustLoggedOut = typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).has('logged-out');

    // Auth state
    const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth();

    // Session status (for expiry warning)
    const sessionStatus = useSessionStatus();

    // Repository and editor (original pattern preserved)
    const repo = useCharacterRepository(characterId, locale);
    const editor = useCharacterEditor(
        characterId,
        repo.updateCharacter,
        repo.getCharacterKey,
        trimmedLocale
    );

    // Claiming state
    const [isClaiming, setIsClaiming] = useState(false);

    // ---- Auto-create character if none exists (original logic) ----
    useEffect(() => {
        if (!characterId && !repo.createCharacter.isPending && !isJustLoggedOut) {
            repo.createCharacter.mutate({
                body: {},
                params: { query: { locale: trimmedLocale } }
            });
        }
    }, [characterId, repo.createCharacter, trimmedLocale, isJustLoggedOut]);

    // ---- Set characterId when character is created (original logic) ----
    useEffect(() => {
        const character = repo.createCharacter.data;
        if (character?.id) {
            setCharacterId(character.id);
        }
    }, [repo.createCharacter.data, setCharacterId]);

    // ---- Generate new character (original logic) ----
    const generateNewCharacter = useCallback(
        (classId?: number) => {
            editor.flush();
            const id = classId ?? Math.floor(Math.random() * (6 - 1 + 1)) + 1;

            repo.createCharacter.mutate({
                body: { class_id: id },
                params: { query: { locale: trimmedLocale } }
            });
        },
        [editor, repo.createCharacter, trimmedLocale]
    );

    // ---- Change locale (original logic) ----
    const changeLocale = useCallback(
        async (newLocale: 'en' | 'pl') => {
            if (newLocale === trimmedLocale) return;
            await changeLanguage(newLocale);
        },
        [trimmedLocale, changeLanguage]
    );

    // ---- Claim character (NEW - guest -> authenticated) ----
    const claimCharacter = useCallback(async () => {
        if (!characterId) {
            showError("No character to claim");
            return;
        }

        setIsClaiming(true);
        try {
            await repo.claimCharacter.mutateAsync({
                params: { path: { id: characterId } }
            } as any);
            showSuccess("Character saved to your account!");
        } catch (err) {
            showError(`Failed to claim character: ${err instanceof Error ? err.message : "Unknown error"}`);
            throw err;
        } finally {
            setIsClaiming(false);
        }
    }, [characterId, repo.claimCharacter, showSuccess, showError]);

    return {
        // Original returns
        characterId,
        character: repo.character,
        error: repo.error,
        isLoading: repo.isLoading || repo.createCharacter.isPending || authLoading,
        locale,

        setCharacterId,
        changeLocale,
        generateNew: generateNewCharacter,

        // All editor methods exposed (original)
        ...editor,
        flushUpdates: editor.flush,

        // NEW: Auth state
        isAuthenticated,
        isGuest,

        // NEW: Session status (for warning banner)
        sessionStatus,

        // NEW: Claim functionality
        claimCharacter,
        isClaiming,
        isJustLoggedOut
    };
}
