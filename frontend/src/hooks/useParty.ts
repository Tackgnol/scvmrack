import { $api } from "@/api";
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useAuth } from "@/hooks/useAuth";
import type { CharacterListItem } from "@/hooks/models";
import { usePartyDetail } from "@/hooks/usePartyRepository";
import { getApiLocale } from "@/hooks/utils.ts";
import { useTranslation } from "react-i18next";

export type PartyMember = {
  id: string;
  name: string;
  disconnected?: boolean;
  /** A recent SSE event touched this member — drives the quiet "changed" pulse. */
  changed?: boolean;
  /** Rolled with an older version of their class than the one now offered. */
  olderRules?: { version: number; latestVersion: number } | null;
};

// The sheet selects its own party; public pages fall back to a party in the account roster.
// Cards fetch their own full sheet lazily via useWarbandMember (party-scoped read
// access on /api/characters/{id}). No bound scvm → no party → empty (pull-tab hides).
export function useParty(): {
  members: PartyMember[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { isAuthenticated } = useAuth();
  const { character, characterId } = useCharacter();
  const { i18n } = useTranslation();
  const locale = getApiLocale(
    i18n.language,
  );

  const listQuery = $api.useQuery(
    "get",
    "/api/characters",
    { params: { query: { locale } } },
    {
      enabled: isAuthenticated,
      // The list only changes when characters/membership do (those paths already
      // invalidate this key) — don't auto-refetch the whole list on focus/remount.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  );

  const list: CharacterListItem[] = Array.isArray(listQuery.data)
    ? listQuery.data
    : [];
  const current = character?.id === characterId
    ? character
    : list.find((c) => c.id === characterId);
  const partyId = characterId
    ? current?.partyId ?? null
    : list.find((c) => Boolean(c.partyId))?.partyId ?? null;

  const partyQuery = usePartyDetail(partyId, Boolean(partyId));
  const members: PartyMember[] = (partyQuery.data?.members ?? [])
    .filter((m): m is typeof m & { characterId: string } =>
      Boolean(m.characterId),
    )
    .map((m) => ({
      id: m.characterId,
      name: m.name?.trim() || "Unnamed scvm",
      olderRules: m.olderRules,
    }));

  return {
    members,
    count: members.length,
    isLoading:
      (isAuthenticated && listQuery.isLoading) ||
      (Boolean(partyId) && partyQuery.isLoading),
    isError: listQuery.isError || partyQuery.isError,
    refetch: () => {
      void listQuery.refetch();
      void partyQuery.refetch();
    },
  };
}
