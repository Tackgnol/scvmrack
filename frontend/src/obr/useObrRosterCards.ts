import { useObrRosterCards as useObrRosterCardsCore } from "@tackgnol/rpgtools-owlbear/react-query";
import { partyKeys } from "@/api/party";
import {
  fetchRoomParticipation,
  participationKey,
  removeRoomCharacter,
} from "@/api/roomParticipation";
import { usePartyStream } from "@/hooks/usePartyStream";
import { getApiLocale } from "@/hooks/utils";
import { scvmrackObrExtension } from "./extension";
import { obrApiClient } from "./obrApiClient";
import { bindRoomSelectedTokens, unbindRoomToken } from "./roomTokenMetadata";
import { finishSceneCleanup } from "./sceneCleanup";
import type {
  ObrRosterState,
  RemoveFromRosterState,
  RoomRosterState,
} from "./useObrRosterCards.models";
import { useObrRoomId } from "./useObrRoomId";
import OBR from "@owlbear-rodeo/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type * from "./useObrRosterCards.models";
export type {
  ObrConnectedPlayer,
  ObrRosterActionState,
} from "@tackgnol/rpgtools-owlbear/react-query";
export { toRosterRows } from "@tackgnol/rpgtools-owlbear/react-query";

function participationOptions(roomId: string) {
  return {
    queryKey: participationKey(roomId),
    queryFn: () => fetchRoomParticipation(roomId),
    enabled: Boolean(roomId),
  };
}

export function useObrRosterCards(): ObrRosterState {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const roomId = useObrRoomId();
  const participation = useQuery(participationOptions(roomId));
  usePartyStream(participation.data?.partyId ?? "", {
    enabled: participation.data?.canManage,
  });
  const [removeRosterAction, setRemoveRosterAction] =
    useState<RemoveFromRosterState>(null);
  const [tokenSyncError, setTokenSyncError] = useState<string | null>(null);
  const [tokenSyncPending, setTokenSyncPending] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const operations = useRef(new Map<string, string>());
  const cleanupInFlight = useRef(false);
  const client = useMemo(
    () => ({
      ...obrApiClient,
      fetchRoomBindings: async (id: string) => {
        const { players, tokens } = await queryClient.fetchQuery(
          participationOptions(id),
        );
        return { roomId: id, players, tokens };
      },
    }),
    [queryClient],
  );
  const players = participation.data?.players;
  const tokens = participation.data?.tokens;
  useEffect(() => {
    if (players && tokens) {
      // The SDK cache is a projection of the server snapshot, including SSE updates.
      queryClient.setQueryData(["obr", "rooms", roomId, "bindings"], {
        roomId,
        players,
        tokens,
      });
    }
  }, [players, tokens, roomId, queryClient]);

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: participationKey(roomId) });
  }, [queryClient, roomId]);

  const roster = useObrRosterCardsCore({
    ext: scvmrackObrExtension,
    obr: OBR,
    client,
    roomId,
    locale: getApiLocale(i18n.language),
    t: (key, fallback) => t(key, fallback),
    extraCharacterIds: participation.data?.memberIds,
    onRefresh,
  }) as RoomRosterState;

  const retrySceneCleanup = useCallback(async () => {
    if (cleanupInFlight.current || !roomId) {
      return;
    }
    cleanupInFlight.current = true;
    await fetchRoomParticipation(roomId)
      .then(async (snapshot) => {
        const complete = await finishSceneCleanup(roomId, snapshot);
        setCleanupMessage(
          t(
            complete
              ? "obr.roster.cleanupComplete"
              : "obr.roster.cleanupPending",
          ),
        );
        await queryClient.invalidateQueries({
          queryKey: participationKey(roomId),
        });
      })
      .finally(() => {
        cleanupInFlight.current = false;
      });
  }, [queryClient, roomId, t]);

  const cleanupIds =
    participation.data?.cleanup.map((item) => item.id).join(",") ?? "";
  useEffect(() => {
    if (cleanupIds) {
      void retrySceneCleanup().catch(() => undefined);
    }
  }, [cleanupIds, retrySceneCleanup]);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    OBR.onReady(() => {
      if (active) {
        unsubscribe = OBR.scene.onReadyChange((ready) => {
          if (ready) {
            void retrySceneCleanup().catch(() => undefined);
          }
        });
      }
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [retrySceneCleanup]);

  async function removeFromRoster(characterId: string) {
    setRemoveRosterAction({ characterId, pending: true, error: null });
    const operationId =
      operations.current.get(characterId) ?? crypto.randomUUID();
    operations.current.set(characterId, operationId);
    try {
      const result = await removeRoomCharacter(
        roomId,
        characterId,
        operationId,
      );
      queryClient.setQueryData(participationKey(roomId), result);
      operations.current.delete(characterId);
      const complete = await finishSceneCleanup(roomId, result);
      setCleanupMessage(
        t(complete ? "obr.roster.removed" : "obr.roster.cleanupPending"),
      );
      await queryClient.invalidateQueries({ queryKey: ["obr"] });
      await queryClient.invalidateQueries({
        queryKey: partyKeys.obrRoom(roomId),
      });
      setRemoveRosterAction({
        characterId,
        pending: false,
        error: null,
      });
    } catch (error) {
      setRemoveRosterAction({
        characterId,
        pending: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function updateTokenBinding(action: () => Promise<unknown>) {
    setTokenSyncPending(true);
    setTokenSyncError(null);
    try {
      await action();
      await roster.refresh();
    } catch (error) {
      setTokenSyncError(error instanceof Error ? error.message : String(error));
    }
    setTokenSyncPending(false);
  }

  return {
    ...roster,
    bindSelectedToken: (input) =>
      updateTokenBinding(() => bindRoomSelectedTokens({ roomId, ...input })),
    unbindToken: (tokenId) =>
      updateTokenBinding(() => unbindRoomToken(roomId, tokenId)),
    action: {
      ...roster.action,
      pending: roster.action.pending || tokenSyncPending,
      error: tokenSyncError ?? roster.action.error,
    },
    removeFromRoster,
    removeRosterAction,
    cleanupMessage,
    cleanupPending: Boolean(participation.data?.cleanup.length),
    retrySceneCleanup,
  };
}
