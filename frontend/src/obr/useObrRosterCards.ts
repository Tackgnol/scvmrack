import {
  useObrRosterCards as useObrRosterCardsCore,
  type ObrConnectedPlayer,
  type ObrRosterActionState,
  type ObrRosterState as CoreObrRosterState,
} from "@tackgnol/rpgtools-owlbear/react-query";
import { partyKeys, promoteObrRoom } from "@/api/party";
import { useObrRoomParty } from "@/hooks/usePartyRepository";
import { getApiLocale } from "@/hooks/utils";
import type {
  ObrCard,
  ObrLocale,
  ObrPlayerCharacterBinding,
  ObrTokenCharacterBinding,
} from "@/api/obr";
import { scvmrackObrExtension } from "@/obr/extension";
import { obrApiClient } from "@/obr/obrApiClient";
import { useObrRoomId } from "@/obr/useObrRoomId";
import OBR from "@owlbear-rodeo/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

// The package's roster outlet is a thin mechanism generic only over the card
// shape (typed `unknown`) — its player/token binding rows are its own minimal
// {playerId,characterId}/{tokenId,characterId} shape, which doesn't know about
// the extra fields scvmrack's real (roomId, id) binding endpoint returns
// (connectionId, assignedByPlayerId, ...). This wrapper re-declares the roster
// row/state shapes with scvmrack's concrete openapi types and casts the core
// hook's return value — the runtime shape is identical (the core hook simply
// passes these objects through), only the static type gets narrowed back for
// the rest of the app.
export type ObrPartyRosterCard = ObrCard;
export type StalePlayerBinding = ObrPlayerCharacterBinding & { stale: boolean };
export type StaleTokenBinding = ObrTokenCharacterBinding & { stale: boolean };

export type ObrPartyRosterBindingRow = {
  id: string;
  characterId: string;
  card: ObrPartyRosterCard | null;
  players: StalePlayerBinding[];
  tokens: StaleTokenBinding[];
};

export type ObrRosterState = Omit<CoreObrRosterState, "rows" | "cards"> & {
  rows: ObrPartyRosterBindingRow[];
  cards: ObrPartyRosterCard[];
};

export type { ObrConnectedPlayer, ObrRosterActionState };
export { toRosterRows } from "@tackgnol/rpgtools-owlbear/react-query";

export function useObrRosterCards(): ObrRosterState {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale = getApiLocale<ObrLocale>(i18n.language);
  const roomId = useObrRoomId();
  const roomParty = useObrRoomParty(roomId);

  // Invite-joined party members have no OBR binding yet; they still belong on
  // the roster so the GM can see and bind them.
  const extraCharacterIds = useMemo(
    () => (roomParty.data?.members ?? []).map((member) => member.characterId),
    [roomParty.data],
  );

  const onRefresh = useCallback(async () => {
    // POST /promote is the sanctioned room-roster read: joins from the main
    // app's invite link happen outside OBR, so no broadcast/scene event can
    // tell us about them — only a fresh read can.
    const party = await promoteObrRoom({
      obrRoomId: roomId,
      name: t("obr.roster.promotedPartyName", "Owlbear room party"),
    });
    queryClient.setQueryData(partyKeys.obrRoom(roomId), party);
  }, [queryClient, roomId, t]);

  return useObrRosterCardsCore({
    ext: scvmrackObrExtension,
    obr: OBR,
    client: obrApiClient,
    roomId,
    locale,
    t: (key, fallback) => t(key, fallback),
    extraCharacterIds,
    onRefresh,
  }) as ObrRosterState;
}
