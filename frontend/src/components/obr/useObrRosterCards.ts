import { fetchObrCards } from "@/api/obr";
import {
  PathsApiCharactersCardsGetParametersQueryLocale,
  type paths,
} from "@/api/schema";
import { getApiLocale } from "@/hooks/utils";
import {
  getBoundCharacterIds,
  isObrRosterBroadcast,
  OBR_ROSTER_CHANNEL,
} from "@/obr/roster";
import OBR from "@owlbear-rodeo/sdk";
import {
  type QueryClient,
  type QueryKey,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type CharacterCardsResponse =
  paths["/api/characters/cards"]["get"]["responses"][200]["content"]["application/json"];

export type ObrPartyRosterCard = CharacterCardsResponse[number];

const EMPTY_ROSTER_CARDS: ObrPartyRosterCard[] = [];
const EMPTY_ROSTER_IDS: string[] = [];
const ROSTER_RESCAN_RETRY_DELAYS_MS = [250, 1000] as const;

export function useObrRosterCards(): ObrPartyRosterCard[] {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const locale = getApiLocale<PathsApiCharactersCardsGetParametersQueryLocale>(
    i18n.language,
  );
  const [boundIds, setBoundIds] = useState<string[]>(EMPTY_ROSTER_IDS);
  const [roomId, setRoomId] = useState("");
  const { data: cardsQueryData } = useQuery({
    queryKey: ["obr", "cards", roomId, boundIds, locale],
    queryFn: () => fetchObrCards(boundIds, roomId, locale),
    enabled: boundIds.length > 0 && roomId.length > 0,
  });

  useEffect(() => {
    let active = true;
    let unsubscribeItems: (() => void) | null = null;
    let unsubscribeSceneReady: (() => void) | null = null;
    let unsubscribeBroadcast: (() => void) | null = null;
    const rescanTimeouts = new Set<number>();

    const setNextIds = (nextIds: string[]) => {
      if (!active) return;
      setBoundIds((currentIds) =>
        areStringArraysEqual(currentIds, nextIds) ? currentIds : nextIds,
      );
    };

    const rescan = async () => {
      setNextIds(await getBoundCharacterIds());
    };

    const scheduleRescan = () => {
      void rescan();
      for (const delay of ROSTER_RESCAN_RETRY_DELAYS_MS) {
        const timeout = window.setTimeout(() => {
          rescanTimeouts.delete(timeout);
          void rescan();
        }, delay);
        rescanTimeouts.add(timeout);
      }
    };

    OBR.onReady(() => {
      if (!active) return;

      setRoomId(OBR.room.id);
      scheduleRescan();
      unsubscribeItems = OBR.scene.items.onChange(() => {
        scheduleRescan();
      });
      unsubscribeSceneReady = OBR.scene.onReadyChange((ready) => {
        if (ready) {
          scheduleRescan();
          return;
        }
        setNextIds(EMPTY_ROSTER_IDS);
      });
      unsubscribeBroadcast = OBR.broadcast.onMessage(
        OBR_ROSTER_CHANNEL,
        (event) => {
          const message = isObrRosterBroadcast(event.data) ? event.data : null;
          if (!message) return;

          if (message.kind === "roster") {
            scheduleRescan();
            return;
          }

          void invalidateCardsQuery(queryClient);
        },
      );
    });

    return () => {
      active = false;
      for (const timeout of rescanTimeouts) {
        window.clearTimeout(timeout);
      }
      unsubscribeItems?.();
      unsubscribeSceneReady?.();
      unsubscribeBroadcast?.();
    };
  }, [queryClient]);

  return (
    (cardsQueryData as ObrPartyRosterCard[] | undefined) ?? EMPTY_ROSTER_CARDS
  );
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function isCardsQueryKey(queryKey: QueryKey): boolean {
  return queryKey[0] === "obr" && queryKey[1] === "cards";
}

async function invalidateCardsQuery(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({
    predicate: (query) => isCardsQueryKey(query.queryKey),
  });
}
