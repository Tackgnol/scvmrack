import {
  useObrRosterCards as useObrRosterCardsCore,
  type ObrConnectedPlayer,
  type ObrRosterActionState,
  type ObrRosterState as CoreObrRosterState,
} from "@tackgnol/rpgtools-owlbear/react-query";
import {
  unbindRoomPlayerCharacter,
  unbindCharacterFromToken,
  broadcastRosterChanged,
} from "@tackgnol/rpgtools-owlbear";
import { partyKeys, promoteObrRoom } from "@/api/party";
import {
  useKickPartyMember,
  useObrRoomParty,
} from "@/hooks/usePartyRepository";
import { getApiLocale } from "@/hooks/utils";
import type {
  ObrCard,
  ObrPlayerCharacterBinding,
  ObrTokenCharacterBinding,
} from "@/api/obr";
import { scvmrackObrExtension } from "@/obr/extension";
import { obrApiClient, obrRoomBindingsClient } from "@/obr/obrApiClient";
import { useObrRoomId } from "@/obr/useObrRoomId";
import OBR from "@owlbear-rodeo/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
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

export type RemoveFromRosterState = {
  characterId: string;
  pending: boolean;
  error: string | null;
} | null;

export type ObrRosterState = Omit<CoreObrRosterState, "rows" | "cards"> & {
  rows: ObrPartyRosterBindingRow[];
  cards: ObrPartyRosterCard[];
  removeFromRoster: (characterId: string) => Promise<void>;
  removeRosterAction: RemoveFromRosterState;
};

export type { ObrConnectedPlayer, ObrRosterActionState };
export { toRosterRows } from "@tackgnol/rpgtools-owlbear/react-query";

export function useObrRosterCards(): ObrRosterState {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale = getApiLocale(i18n.language);
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

  const roster = useObrRosterCardsCore({
    ext: scvmrackObrExtension,
    obr: OBR,
    client: obrApiClient,
    roomId,
    locale,
    t: (key, fallback) => t(key, fallback),
    extraCharacterIds,
    onRefresh,
  }) as ObrRosterState;

  const partyId = roomParty.data?.id ?? null;
  const partyMemberCharacterIds = useMemo(
    () => new Set((roomParty.data?.members ?? []).map((m) => m.characterId)),
    [roomParty.data],
  );
  const kickPartyMember = useKickPartyMember(partyId ?? "");
  const [removeRosterAction, setRemoveRosterAction] =
    useState<RemoveFromRosterState>(null);

  // Core roster actions swallow errors for their own UI; removal must stop
  // before kicking a member whose bindings could not be cleared.
  const removeFromRoster = useCallback(
    async (characterId: string) => {
      const row = roster.rows.find((r) => r.characterId === characterId);
      setRemoveRosterAction({ characterId, pending: true, error: null });

      const results = await Promise.allSettled([
        ...(row?.players.map((player) =>
          unbindRoomPlayerCharacter(
            scvmrackObrExtension,
            OBR,
            obrRoomBindingsClient,
            {
              roomId,
              playerId: player.playerId,
            },
          ),
        ) ?? []),
        ...(row?.tokens.map(async (token) => {
          // Keep the durable binding discoverable until scene cleanup succeeds.
          await unbindCharacterFromToken(
            scvmrackObrExtension,
            OBR,
            token.tokenId,
          );
          await obrRoomBindingsClient.clearTokenCharacter({
            roomId,
            tokenId: token.tokenId,
          });
          await broadcastRosterChanged(scvmrackObrExtension, OBR);
        }) ?? []),
      ]);
      const rejected = results.find(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      let failure: unknown = rejected?.reason;
      try {
        if (!rejected && partyId && partyMemberCharacterIds.has(characterId)) {
          await kickPartyMember.mutateAsync(characterId);
        }
      } catch (error) {
        if (failure === null || failure === undefined) {
          failure = error;
        }
      }
      try {
        await roster.refresh();
      } catch (error) {
        if (failure === null || failure === undefined) {
          failure = error;
        }
      }
      setRemoveRosterAction({
        characterId,
        pending: false,
        error:
          rejected || failure !== undefined
            ? failure instanceof Error
              ? failure.message
              : String(failure)
            : null,
      });
    },
    [roster, roomId, partyId, partyMemberCharacterIds, kickPartyMember],
  );

  return { ...roster, removeFromRoster, removeRosterAction };
}
