import { $api } from '@/api';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type CharacterListItem } from '@/hooks/models.ts';
import { getApiLocale, getCharacterKey } from '@/hooks/utils.ts';
import { useAuth } from '@/hooks/useAuth';
import { PathsApiCharactersGetParametersQueryLocale } from '@/api/schema.ts';
import { useErrorFeedback } from '@/components/molecules/feedback/ErrorFeedbackProvider';
import { appHistory } from '@/router/history';
import { buildHomeCallbackUrl } from '@/router/navigation';
import {
  getUserFacingApiErrorMessage,
  isUnexpectedApiError,
} from '@/utils/errorUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Owns the data + mutations for the saved-characters page: list query, create, and
// delete (with modal state, cache eviction, active-character reset, and error surfacing).
// The page stays presentational; this is independently testable.
export function useCharactersList() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isGuest } = useAuth();
  const { showUnexpectedError } = useErrorFeedback();
  const queryClient = useQueryClient();
  const { characterId, lastCharacterId, setCharacterId, generateNew } = useCharacter();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CharacterListItem | null>(null);
  const locale = getApiLocale<PathsApiCharactersGetParametersQueryLocale>(
    i18n.language
  );

  const charactersQuery = $api.useQuery(
    'get',
    '/api/characters',
    {
      params: {
        query: { locale },
      },
    },
    { enabled: isAuthenticated, refetchOnMount: 'always' }
  );
  const deleteCharacterMutation = $api.useMutation('delete', '/api/characters/{id}');
  const characters = (charactersQuery.data as CharacterListItem[] | undefined) ?? [];

  useEffect(() => {
    if (!charactersQuery.error || !isUnexpectedApiError(charactersQuery.error)) {
      return;
    }

    showUnexpectedError(charactersQuery.error, {
      source: 'characters_list',
      operation: 'list_characters',
    });
  }, [charactersQuery.error, showUnexpectedError]);

  const createNew = () => {
    if (isCreating) return;

    setDeleteError(null);
    setIsCreating(true);
    generateNew(undefined, {
      onSuccess: (newCharacterId) => {
        void appHistory.push(buildHomeCallbackUrl(newCharacterId));
      },
      onError: (error) => {
        setIsCreating(false);
        if (isUnexpectedApiError(error)) {
          const reported = showUnexpectedError(error, {
            source: 'characters_list_create',
            operation: 'create_character',
          });
          if (!reported) {
            setDeleteError(
              getUserFacingApiErrorMessage(error, t, 'Failed to create character')
            );
          }
          return;
        }
        setDeleteError(
          getUserFacingApiErrorMessage(error, t, 'Failed to create character')
        );
      },
    });
  };

  const requestDelete = (character: CharacterListItem) => {
    if (!character.id || deletingId) return;

    setDeleteError(null);
    setDeleteCandidate(character);
  };

  const cancelDelete = () => {
    if (deletingId) return;
    setDeleteCandidate(null);
  };

  const confirmDelete = async () => {
    const character = deleteCandidate;
    if (!character?.id) return;

    setDeleteError(null);
    setDeletingId(character.id);
    try {
      await deleteCharacterMutation.mutateAsync({
        params: {
          path: { id: character.id },
        },
      });
    } catch (error) {
      if (isUnexpectedApiError(error)) {
        showUnexpectedError(error, {
          source: 'characters_list_delete',
          operation: 'delete_character',
          characterId: character.id,
        });
        setDeleteError(t('characters.deleteError', 'Failed to delete character'));
      } else {
        setDeleteError(getUserFacingApiErrorMessage(error, t, 'Failed to delete character'));
      }
      setDeletingId(null);
      setDeleteCandidate(null);
      return;
    }

    queryClient.removeQueries({ queryKey: getCharacterKey(character.id, i18n.language) });

    if (character.id === characterId) {
      await setCharacterId(null);
    }

    // Refetch failure after a successful delete is non-fatal — don't show a
    // misleading delete-failure message.
    await charactersQuery.refetch().catch(() => {});

    setDeletingId(null);
    setDeleteCandidate(null);
  };

  return {
    isGuest,
    characters,
    activeId: characterId,
    backUrl: buildHomeCallbackUrl(characterId || lastCharacterId),
    isLoading: charactersQuery.isLoading,
    loadError: charactersQuery.error,
    deleteError,
    deleteCandidate,
    isCreating,
    deletingId,
    createNew,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
