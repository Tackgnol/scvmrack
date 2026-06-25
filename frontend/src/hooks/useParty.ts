import { $api } from "@/api";
import { PathsApiCharactersGetParametersQueryLocale } from "@/api/schema.ts";
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
};

// The warband takeover shows the GM-owned party the player's scvm is bound to — every
// player's scvm, not just the viewer's own. We discover the party from the player's
// character list (the bound scvm carries its `partyId`), then read the party roster.
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
  const { i18n } = useTranslation();
  const locale = getApiLocale<PathsApiCharactersGetParametersQueryLocale>(
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
  const partyId = list.find((c) => Boolean(c.partyId))?.partyId ?? null;

  const partyQuery = usePartyDetail(partyId, Boolean(partyId));
  const members: PartyMember[] = (partyQuery.data?.members ?? [])
    .filter((m): m is typeof m & { characterId: string } =>
      Boolean(m.characterId),
    )
    .map((m) => ({
      id: m.characterId,
      name: m.name?.trim() || "Unnamed scvm",
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
