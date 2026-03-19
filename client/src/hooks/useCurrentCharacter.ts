import {PathsCharactersNewPostParametersQueryLocale} from "@/api/schema.ts";
import { trackEvent } from '@/analytics/googleAnalytics';
import {useAuth} from "@/hooks/useAuth.ts";
import { useCharacterEditor } from "@/hooks/useCharacterEditor.ts";
import { useCharacterId } from "@/hooks/useCharacterId.ts";
import { useCharacterRepository } from "@/hooks/useCharacterRepository.ts";
import { appHistory } from '@/router/history';
import { hasCurrentSearchParam, LOGGED_OUT_QUERY_PARAM } from '@/router/navigation';
import { useSessionStatus } from "@/hooks/useSessionStatus.ts";
import {getApiLocale} from "@/hooks/utils.ts";
import {useSnackbar} from "@/SnackbarContext/SnackbarProvider.tsx";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

const subscribeToHistory = (onStoreChange: () => void): (() => void) => {
    return appHistory.subscribe(() => onStoreChange());
};

const getLoggedOutSnapshot = (): boolean => {
    return hasCurrentSearchParam(LOGGED_OUT_QUERY_PARAM);
};

const getPathnameSnapshot = (): string => {
    return appHistory.location.pathname;
};

type GenerateNewOptions = {
    onSuccess?: (newCharacterId: string) => void;
    onError?: (error: unknown) => void;
};

let pendingAutoCreateController: AbortController | null = null;

export function useCurrentCharacter() {
    const { characterId, lastCharacterId, setCharacterId } = useCharacterId();
    const { i18n: { changeLanguage, language: locale } } = useTranslation();
    const trimmedLocale = getApiLocale<PathsCharactersNewPostParametersQueryLocale>(locale);
    const { showSuccess, showError } = useSnackbar();

    const isJustLoggedOut = useSyncExternalStore(
        subscribeToHistory,
        getLoggedOutSnapshot,
        () => false
    );
    const pathname = useSyncExternalStore(
        subscribeToHistory,
        getPathnameSnapshot,
        () => '/'
    );

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

    // ---- Handle logout side effects ----
    useEffect(() => {
        if (isJustLoggedOut && (characterId || lastCharacterId)) {
            // Force clear current and remembered character ID when user logs out.
            setCharacterId(null);
        }
    }, [isJustLoggedOut, characterId, lastCharacterId, setCharacterId]);

    // ---- Auto-create character if none exists (original logic) ----
    useEffect(() => {
        if (pathname !== '/') return;
        if (authLoading) return;

        if (!characterId && !repo.createCharacter.isPending && !repo.createCharacter.data?.id && !isJustLoggedOut) {
            pendingAutoCreateController?.abort();
            const controller = new AbortController();
            pendingAutoCreateController = controller;

            repo.createCharacter.mutate({
                body: {},
                params: { query: { locale: trimmedLocale } },
                signal: controller.signal,
            }, {
                onSuccess: (character) => {
                    if (character?.id) {
                        setCharacterId(character.id);
                    }
                },
                onSettled: () => {
                    if (pendingAutoCreateController === controller) {
                        pendingAutoCreateController = null;
                    }
                },
                onError: (error) => {
                    if (error instanceof DOMException && error.name === 'AbortError') {
                        return;
                    }
                },
            });
        }
    }, [characterId, repo.createCharacter, trimmedLocale, isJustLoggedOut, pathname, authLoading, setCharacterId]);

    // ---- Set characterId when character is created (original logic) ----
    useEffect(() => {
        const character = repo.createCharacter.data;
        if (character?.id) {
            setCharacterId(character.id);
        }
    }, [repo.createCharacter.data, setCharacterId]);

    // ---- Generate new character (original logic) ----
    const generateNewCharacter = useCallback(
        (classId?: number, options?: GenerateNewOptions) => {
            pendingAutoCreateController?.abort();
            pendingAutoCreateController = null;

            editor.flush();
            const id = classId ?? Math.floor(Math.random() * (6 - 1 + 1)) + 1;

            repo.createCharacter.mutate({
                body: { class_id: id },
                params: { query: { locale: trimmedLocale } }
            }, {
                onSuccess: (character) => {
                    if (character?.id) {
                        setCharacterId(character.id);
                        options?.onSuccess?.(character.id);
                    }
                    trackEvent('generate_character', {
                        source: 'manual',
                        locale: trimmedLocale,
                        class_id: id,
                        is_authenticated: isAuthenticated,
                        is_guest: isGuest,
                    });
                },
                onError: (error) => {
                    options?.onError?.(error);
                },
            });
        },
        [editor, repo.createCharacter, trimmedLocale, isAuthenticated, isGuest, setCharacterId]
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
    const claimCharacter = useCallback(async (idToClaim?: string) => {
        const targetId = idToClaim || characterId;
        if (!targetId) {
            showError("No character to claim");
            return;
        }

        setIsClaiming(true);
        try {
            await repo.claimCharacter.mutateAsync({
                params: { path: { id: targetId } }
            } as any);
            trackEvent('claim_character', {
                locale: trimmedLocale,
                was_guest: isGuest,
                is_authenticated: isAuthenticated,
            });
            showSuccess("Character saved to your account!");
            
            // If we successfully claimed a specific character and we don't have one active, set it
            if (idToClaim && idToClaim !== characterId) {
                setCharacterId(idToClaim);
            }
        } catch (err) {
            showError(`Failed to claim character: ${err instanceof Error ? err.message : "Unknown error"}`);
            throw err;
        } finally {
            setIsClaiming(false);
        }
    }, [characterId, repo.claimCharacter, showSuccess, showError, trimmedLocale, isGuest, isAuthenticated, setCharacterId]);

    return {
        // Original returns
        characterId,
        lastCharacterId,
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
