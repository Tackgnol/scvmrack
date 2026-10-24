import { useObrRosterCards as useObrRosterCardsCore } from "@tackgnol/rpgtools-owlbear/react-query";
import { partyKeys, promoteObrRoom } from "@/api/party";
import {
  useKickPartyMember,
  useObrRoomParty,
} from "@/hooks/usePartyRepository";
import { getApiLocale } from "@/hooks/utils";
import { scvmrackObrExtension } from "@/obr/extension";
import { obrApiClient } from "@/obr/obrApiClient";
import { clearRosterBindings } from "@/obr/rosterBindings";
import type {
  ObrRosterState,
  RemoveFromRosterState,
  RoomRosterState,
} from "./useObrRosterCards.models";
import { useObrRoomId } from "@/obr/useObrRoomId";
import OBR from "@owlbear-rodeo/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export type * from "./useObrRosterCards.models";
export type {
  ObrConnectedPlayer,
  ObrRosterActionState,
} from "@tackgnol/rpgtools-owlbear/react-query";
export { toRosterRows } from "@tackgnol/rpgtools-owlbear/react-query";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useObrRosterCards(): ObrRosterState {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale = getApiLocale(i18n.language);
  const roomId = useObrRoomId();
  const roomParty = useObrRoomParty(roomId);

  // Invite-joined party members have no OBR binding yet; they still belong on
  // the roster so the GM can see and bind them.
  const memberCharacterIds = useMemo(
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

  const roster = useObrRosterCardsCore({
    ext: scvmrackObrExtension,
    obr: OBR,
    client: obrApiClient,
    roomId,
    locale,
    t: (key, fallback) => t(key, fallback),
    extraCharacterIds: memberCharacterIds,
    onRefresh,
  }) as RoomRosterState;

  const partyId = roomParty.data?.id ?? null;
  const kickPartyMember = useKickPartyMember(partyId ?? "");
  const [removeRosterAction, setRemoveRosterAction] =
    useState<RemoveFromRosterState>(null);

  async function removeFromRoster(characterId: string) {
    setRemoveRosterAction({ characterId, pending: true, error: null });
    let removalError: string | null = null;
    try {
      const row = roster.rows.find((item) => item.characterId === characterId);
      await clearRosterBindings(roomId, row);
      if (partyId && memberCharacterIds.includes(characterId)) {
        await kickPartyMember.mutateAsync(characterId);
      }
    } catch (error) {
      removalError = errorMessage(error);
    }

    const refreshError = await roster.refresh().then(() => null, errorMessage);
    setRemoveRosterAction({
      characterId,
      pending: false,
      error: removalError ?? refreshError,
    });
  }

  return { ...roster, removeFromRoster, removeRosterAction };
}
