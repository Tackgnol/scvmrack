import { $api } from '@/api';
import { PathsApiCharactersIdGetParametersQueryLocale } from '@/api/schema.ts';
import { getApiLocale } from '@/hooks/utils.ts';
import type { Character } from '@/hooks/models';
import {
  toWarbandMember,
  type WarbandMember,
} from '@/components/organisms/party/warbandMember';
import { useTranslation } from 'react-i18next';

// Fetches one scvm's full sheet and projects it into the read-only WarbandMember
// view-model. Each warband card owns its own query, so the takeover loads a small
// party member-by-member without a bespoke batch endpoint. Only enabled while the
// `enabled` flag is set (i.e. the takeover is open) so closed parties stay idle.
export function useWarbandMember(
  id: string,
  options: { enabled?: boolean } = {}
): {
  member: WarbandMember | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { i18n } = useTranslation();
  const locale = getApiLocale<PathsApiCharactersIdGetParametersQueryLocale>(
    i18n.language
  );

  const query = $api.useQuery(
    'get',
    '/api/characters/{id}',
    { params: { path: { id }, query: { locale } } },
    {
      enabled: (options.enabled ?? true) && !!id,
      // Read-only glance view. Fetch a member's sheet once and never auto-refire on
      // focus/remount — that burst (one call per card, every alt-tab) is what tripped
      // the rate limiter. A real edit still lands: this shares the exact `/api/characters/{id}`
      // cache key the editor reconciles, so changes target this one card by id, not all.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }
  );

  const character = query.data as Character | undefined;

  return {
    member: character ? toWarbandMember(character) : undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
