import { type MutableRefObject } from 'react';
import { trackEvent } from '@/analytics/googleAnalytics';
import { replacePartyMember } from '@/api/party';
import {
  getUserFacingApiErrorMessage,
  isApiNotFound,
  isApiRateLimited,
  isUnexpectedApiError,
} from '@/utils/errorUtils';

export type GenerateNewOptions = {
  onSuccess?: (newCharacterId: string) => void;
  onError?: (error: unknown) => void;
  select?: boolean;
  replace?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches the $api mutation surface
type Mutation = { mutate: (vars: any, options?: any) => void };

type ReportUnexpectedError = (
  error: unknown,
  context: {
    source: string;
    operation: string;
    locale: string;
    classId?: number;
    characterId?: string;
  },
  fallbackMessage: string
) => void;

type Params = {
  characterId: string | null;
  partyId?: string | null;
  isSessionExpired: boolean;
  trimmedLocale: string;
  isAuthenticated: boolean;
  isGuest: boolean;
  createCharacter: Mutation;
  deleteCharacter: Mutation;
  setCharacterId: (id: string | null) => void | Promise<void>;
  flushEditor: () => void;
  setAutoCreateFailed: (failed: boolean) => void;
  controllerRef: MutableRefObject<AbortController | null>;
  reportUnexpectedError: ReportUnexpectedError;
  showError: (message: string) => void;
  t: (key: string, fallback: string) => string;
  changeLanguage: (locale: string) => Promise<unknown>;
};

/**
 * User-driven character actions: manual generate, kill-and-replace, and locale
 * change. Shares the auto-create controller ref so a manual generate cancels any
 * in-flight auto-create.
 */
export function useCharacterActions({
  characterId,
  partyId,
  isSessionExpired,
  trimmedLocale,
  isAuthenticated,
  isGuest,
  createCharacter,
  deleteCharacter,
  setCharacterId,
  flushEditor,
  setAutoCreateFailed,
  controllerRef,
  reportUnexpectedError,
  showError,
  t,
  changeLanguage,
}: Params) {
  const generateNew = (classId?: number, options?: GenerateNewOptions) => {
    if (isSessionExpired) {
      return;
    }

    controllerRef.current?.abort();
    controllerRef.current = null;
    setAutoCreateFailed(false);

    flushEditor();
    const id = classId ?? Math.floor(Math.random() * (6 - 1 + 1)) + 1;

    createCharacter.mutate(
      {
        body: { classId: id, ...(options?.replace ? { replace: true } : {}) },
        params: { query: { locale: trimmedLocale } },
      },
      {
        onSuccess: (character: { id?: string } | undefined) => {
          if (character?.id) {
            if (options?.select !== false) {
              void setCharacterId(character.id);
            }
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
        onError: (error: unknown) => {
          if (isApiRateLimited(error)) {
            showError(
              t('auth.rateLimit', 'Too many requests. Please try again later.')
            );
          } else if (isUnexpectedApiError(error)) {
            reportUnexpectedError(
              error,
              {
                source: 'character_generate',
                operation: 'create_character',
                locale: trimmedLocale,
                classId: id,
              },
              'Failed to create character'
            );
          } else {
            showError(
              getUserFacingApiErrorMessage(error, t, 'Failed to create character')
            );
          }
          options?.onError?.(error);
        },
      }
    );
  };

  const killAndReplace = (options?: GenerateNewOptions) => {
    if (isSessionExpired) {
      return;
    }

    const idToKill = characterId;
    if (!idToKill) {
      // No character to kill, just generate
      generateNew(undefined, options);
      return;
    }

    flushEditor();

    // Generate the replacement FIRST, then delete the old one once the new
    // character exists and is the active selection. Generate-then-delete keeps
    // the operation safe if generation fails (e.g. rate limited) — the old
    // character survives instead of leaving the app pointed at a deleted id —
    // and because the active query has already moved to the new id, removing
    // the old character's cache entry no longer refetches a deleted record.
    generateNew(undefined, {
      ...options,
      replace: true,
      select: partyId ? false : options?.select,
      onSuccess: (newCharacterId) => {
        const deleteOldCharacter = () => {
          deleteCharacter.mutate(
            { params: { path: { id: idToKill } } },
            {
              onSuccess: () => {
                trackEvent('kill_character', {
                  locale: trimmedLocale,
                  is_authenticated: isAuthenticated,
                  is_guest: isGuest,
                });
              },
              onError: (error: unknown) => {
                // The replacement is already active; a failure to delete the old
                // record is non-blocking. 404 means it was already gone.
                if (!isApiNotFound(error) && isUnexpectedApiError(error)) {
                  reportUnexpectedError(
                    error,
                    {
                      source: 'character_kill',
                      operation: 'delete_character',
                      characterId: idToKill,
                      locale: trimmedLocale,
                    },
                    'Failed to delete the replaced character'
                  );
                }
              },
            }
          );
        };

        if (!partyId) {
          options?.onSuccess?.(newCharacterId);
          deleteOldCharacter();
          return;
        }

        void (async () => {
          try {
            await replacePartyMember({
              partyId,
              oldCharacterId: idToKill,
              newCharacterId,
            });
            await setCharacterId(newCharacterId);
            options?.onSuccess?.(newCharacterId);
            deleteOldCharacter();
          } catch (error) {
            if (isUnexpectedApiError(error)) {
              reportUnexpectedError(
                error,
                {
                  source: 'character_kill',
                  operation: 'replace_party_member',
                  characterId: idToKill,
                  locale: trimmedLocale,
                },
                'Failed to bind replacement to party'
              );
            } else {
              showError(
                getUserFacingApiErrorMessage(
                  error,
                  t,
                  'Failed to bind replacement to party'
                )
              );
            }
            options?.onError?.(error);
          }
        })();
      },
    });
  };

  const changeLocale = async (newLocale: 'en' | 'pl') => {
    if (newLocale === trimmedLocale) return;
    await changeLanguage(newLocale);
    trackEvent('language_changed', { from: trimmedLocale, to: newLocale });
  };

  return { generateNew, killAndReplace, changeLocale };
}
