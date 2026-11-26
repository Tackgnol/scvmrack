import { useObrRosterCards as useObrRosterCardsCore } from "@tackgnol/rpgtools-owlbear/react-query";
import { partyKeys } from "@/api/party";
import { obrKeys } from "@/api/obrKeys";
import { refreshQueries } from "@/api/queryCache";
import { errorMessage } from "@/utils/errorMessage";
import {
  fetchRoomParticipation,
  participationKey,
  removeRoomCharacter,
} from "@/api/roomParticipation";
import {
  fetchCurrentRoomParticipation,
  roomParticipationOptions,
} from "@/api/roomParticipationQueries";
import { usePartyStream } from "@/hooks/usePartyStream";
import { getApiLocale } from "@/hooks/utils";
import { broadcastRosterChanged, scvmrackObrExtension } from "./extension";
import { obrApiClient } from "./obrApiClient";
import { bindRoomSelectedTokens, unbindRoomToken } from "./roomTokenMetadata";
import { finishSceneCleanup } from "./sceneCleanup";
import type {
  ObrRosterState,
  RemoveFromRosterState,
  RoomRosterState,
} from "./useObrRosterCards.models";
import { useObrRoomId } from "./useObrRoomId";
import { sdkOwlbear } from "./owlbear";
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

export function useObrRosterCards(): ObrRosterState {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const roomId = useObrRoomId();
  const participation = useQuery(roomParticipationOptions(roomId));
  usePartyStream(participation.data?.partyId ?? "", {
    enabled: participation.data?.canManage,
    onChanged: () => {
      void refreshQueries(queryClient, { queryKey: obrKeys.cards() });
    },
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
      // SDK binding refetches follow roster changes; the 5-min cached snapshot predates them.
      fetchRoomBindings: async (id: string) => {
        const { players, tokens } = await fetchCurrentRoomParticipation(
          queryClient,
          id,
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
      queryClient.setQueryData(obrKeys.bindings(roomId), {
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
  useEffect(
    () =>
      sdkOwlbear.whenReady(() =>
        OBR.scene.onReadyChange((ready) => {
          if (ready) {
            void retrySceneCleanup().catch(() => undefined);
          }
        }),
      ),
    [retrySceneCleanup],
  );

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
      await queryClient.cancelQueries({ queryKey: participationKey(roomId) });
      queryClient.setQueryData(participationKey(roomId), result);
      operations.current.delete(characterId);
      // Scene cleanup broadcasts only when it has tokens to clear; players must hear every removal.
      await broadcastRosterChanged(scvmrackObrExtension, OBR).catch(
        () => undefined,
      );
      const complete = await finishSceneCleanup(roomId, result);
      setCleanupMessage(
        t(complete ? "obr.roster.removed" : "obr.roster.cleanupPending"),
      );
      await queryClient.invalidateQueries({ queryKey: obrKeys.all });
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
        error: errorMessage(error),
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
      setTokenSyncError(errorMessage(error));
    }
    setTokenSyncPending(false);
  }

  return {
    ...roster,
    bindSelectedToken: (input) =>
      updateTokenBinding(async () => {
        if (!(await OBR.player.getSelection())?.length) {
          throw new Error(
            t("obr.roster.selectTokenFirst", "Select a token on the map first"),
          );
        }
        return bindRoomSelectedTokens({ roomId, ...input });
      }),
    unbindToken: (tokenId) =>
      updateTokenBinding(() => unbindRoomToken(roomId, tokenId)),
    action: {
      ...roster.action,
      pending: roster.action.pending || tokenSyncPending,
      error: tokenSyncError ?? roster.action.error,
    },
    canManage: Boolean(participation.data?.canManage),
    removeFromRoster,
    removeRosterAction,
    cleanupMessage,
    cleanupPending: Boolean(participation.data?.cleanup.length),
    retrySceneCleanup,
  };
}
