import {PathsCharactersNewPostParametersQueryLocale} from "@/api/schema.ts";
import { trackEvent } from '@/analytics/googleAnalytics';
import {useAuth} from "@/hooks/useAuth.ts";
import { useCharacterEditor } from "@/hooks/useCharacterEditor.ts";
import { useCharacterId } from "@/hooks/useCharacterId.ts";
import { useCharacterRepository } from "@/hooks/useCharacterRepository.ts";
import { appHistory } from '@/router/history';
import { hasCurrentSearchParam, LOGGED_OUT_QUERY_PARAM } from '@/router/navigation';
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
    const [autoCreateFailed, setAutoCreateFailed] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(false);

    // ---- Handle logout side effects ----
    useEffect(() => {
        if (isJustLoggedOut && (characterId || lastCharacterId)) {
            // Force clear current and remembered character ID when user logs out.
            setCharacterId(null);
            setAutoCreateFailed(false);
        }
    }, [isJustLoggedOut, characterId, lastCharacterId, setCharacterId]);

    // ---- Check for existing characters, then auto-create if none found ----
    useEffect(() => {
        if (pathname !== '/') return;
        if (authLoading) return;
        if (characterId) return;
        if (isJustLoggedOut) return;
        if (autoCreateFailed) return;

        let cancelled = false;
        const controller = new AbortController();

        pendingAutoCreateController?.abort();
        pendingAutoCreateController = controller;
        setCheckingExisting(true);

        (async () => {
            // Step 1: Check if user already has characters (raw fetch to avoid auth middleware redirect)
            try {
                const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
                const res = await fetch(`${baseUrl}/characters`, {
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (!cancelled && res.ok) {
                    const chars = (await res.json()) as Array<{ id: string }>;
                    if (chars.length > 0) {
                        setCharacterId(chars[0].id);
                        setCheckingExisting(false);
                        return;
                    }
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                // List fetch failed — fall through to create
            }

            if (cancelled) return;
            setCheckingExisting(false);

            // Step 2: No existing characters — create a new one
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
                    setAutoCreateFailed(true);
                    showError("Failed to create character. The server may be experiencing issues.");
                },
            });
        })();

        return () => {
            cancelled = true;
            controller.abort();
            pendingAutoCreateController = null;
            setCheckingExisting(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, authLoading, characterId, isJustLoggedOut, autoCreateFailed, trimmedLocale]);

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
            setAutoCreateFailed(false);

            editor.flush();
            const id = classId ?? Math.floor(Math.random() * (6 - 1 + 1)) + 1;

            repo.createCharacter.mutate({
                body: { classId: id },
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
                        classId: id,
                        is_authenticated: isAuthenticated,
                        is_guest: isGuest,
                    });
                },
                onError: (error) => {
                    options?.onError?.(error);
                },
            });
        },
        [editor, repo.createCharacter, trimmedLocale, isAuthenticated, isGuest, setCharacterId, setAutoCreateFailed]
    );

    // ---- Kill current character and generate a new one ----
    const killAndReplace = useCallback(
        (options?: GenerateNewOptions) => {
            const idToKill = characterId;
            if (!idToKill) {
                // No character to kill, just generate
                generateNewCharacter(undefined, options);
                return;
            }

            editor.flush();

            // Delete first, then generate
            repo.deleteCharacter.mutate(
                { params: { path: { id: idToKill } } } as any,
                {
                    onSuccess: () => {
                        trackEvent('kill_character', {
                            locale: trimmedLocale,
                            is_authenticated: isAuthenticated,
                            is_guest: isGuest,
                        });
                        generateNewCharacter(undefined, options);
                    },
                    onError: (error) => {
                        showError('Failed to kill character');
                        options?.onError?.(error);
                    },
                }
            );
        },
        [characterId, editor, repo.deleteCharacter, generateNewCharacter, trimmedLocale, isAuthenticated, isGuest, showError]
    );

    // ---- Change locale (original logic) ----
    const changeLocale = useCallback(
        async (newLocale: 'en' | 'pl') => {
            if (newLocale === trimmedLocale) return;
            await changeLanguage(newLocale);
            trackEvent('language_changed', { from: trimmedLocale, to: newLocale });
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
        isLoading: repo.isLoading || repo.createCharacter.isPending || authLoading || checkingExisting,
        locale,

        setCharacterId,
        changeLocale,
        generateNew: generateNewCharacter,
        killAndReplace,

        // All editor methods exposed (original)
        ...editor,
        flushUpdates: editor.flush,

        // NEW: Auth state
        isAuthenticated,
        isGuest,

        // NEW: Claim functionality
        claimCharacter,
        isClaiming,
        isJustLoggedOut
    };
}
