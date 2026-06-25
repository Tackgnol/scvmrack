import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";
import { partyKeys } from "@/api/party";
import { embeddedSessionHeaders } from "@/utils/embed";

export type PartyStreamEvent =
  | { type: "character.updated"; characterId: string; fields: string[] }
  | { type: "character.joined"; characterId: string }
  | { type: "character.left"; characterId: string }
  | { type: "character.kicked"; characterId: string }
  | { type: "character.presence"; characterId: string; connected: boolean }
  | { type: "party.presenceSnapshot"; presence: Record<string, boolean> }
  | { type: "party.linkRotated" }
  | { type: "party.closed" };

export type PartyStreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "error"
  | "closed";

export type ChangedFieldsByCharacter = Record<string, string[]>;
export type PresenceByCharacter = Record<string, boolean>;

type UsePartyStreamOptions = {
  enabled?: boolean;
  onClosed?: () => void;
};

export const partyRosterQueryKey = partyKeys.roster;

export const partyDetailQueryKey = partyKeys.detail;

export const partyMemberDetailQueryKey = partyKeys.character;

export function partyStreamUrl(partyId: string): string {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
  return `${baseUrl}/api/parties/${partyId}/stream`;
}

// Thrown from onopen for a non-retryable response (auth failure, wrong stream) so
// onerror can stop reconnecting instead of looping.
class FatalStreamError extends Error {}

function parsePartyEvent(data: string): PartyStreamEvent | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as Partial<PartyStreamEvent>;
    if (!parsed || typeof parsed.type !== "string") {
      return null;
    }
    return parsed as PartyStreamEvent;
  } catch {
    return null;
  }
}

function characterIdFrom(data: string): string | null {
  const parsed = parsePartyEvent(data);
  return parsed &&
    "characterId" in parsed &&
    typeof parsed.characterId === "string"
    ? parsed.characterId
    : null;
}

export function usePartyStream(
  partyId: string | null | undefined,
  options: UsePartyStreamOptions = {},
) {
  const queryClient = useQueryClient();
  const { enabled = true, onClosed } = options;
  const onClosedRef = useRef(onClosed);
  const [status, setStatus] = useState<PartyStreamStatus>("idle");
  const [changedFieldsByCharacter, setChangedFieldsByCharacter] =
    useState<ChangedFieldsByCharacter>({});
  const [presenceByCharacter, setPresenceByCharacter] =
    useState<PresenceByCharacter>({});

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  const clearChangedFields = useCallback((characterId?: string) => {
    setChangedFieldsByCharacter((current) => {
      if (!characterId) {
        return {};
      }

      const next = { ...current };
      delete next[characterId];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !partyId) {
      setStatus("idle");
      setPresenceByCharacter({});
      return;
    }

    // fetch-based SSE (not native EventSource) so the stream rides the same
    // credentialed-fetch path as the rest of the API and can carry the
    // `x-embedded-session` marker — native EventSource cannot send headers, which
    // breaks the cross-site itch.io embed. AbortController replaces source.close().
    const controller = new AbortController();
    setStatus("connecting");

    const invalidateRoster = () => {
      void queryClient.invalidateQueries({ queryKey: partyRosterQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: partyDetailQueryKey(partyId),
      });
    };

    const invalidateMember = (characterId: string) => {
      void queryClient.invalidateQueries({
        queryKey: partyMemberDetailQueryKey(characterId),
      });
    };

    const handleCharacterUpdated = (data: string) => {
      const parsed = parsePartyEvent(data);
      if (
        !parsed ||
        parsed.type !== "character.updated" ||
        typeof parsed.characterId !== "string" ||
        !Array.isArray(parsed.fields)
      ) {
        return;
      }

      const fields = parsed.fields.filter(
        (field): field is string => typeof field === "string",
      );
      setChangedFieldsByCharacter((current) => ({
        ...current,
        [parsed.characterId]: fields,
      }));
      invalidateMember(parsed.characterId);
    };

    const handleRosterEvent = (data: string) => {
      const characterId = characterIdFrom(data);
      invalidateRoster();
      if (characterId) {
        invalidateMember(characterId);
      }
    };

    const handlePresenceSnapshot = (data: string) => {
      const parsed = parsePartyEvent(data);
      if (!parsed || parsed.type !== "party.presenceSnapshot") {
        return;
      }

      const entries = Object.entries(parsed.presence ?? {}).filter(
        (entry): entry is [string, boolean] =>
          typeof entry[0] === "string" && typeof entry[1] === "boolean",
      );
      setPresenceByCharacter(Object.fromEntries(entries));
    };

    const handlePresenceEvent = (data: string) => {
      const parsed = parsePartyEvent(data);
      if (
        !parsed ||
        parsed.type !== "character.presence" ||
        typeof parsed.characterId !== "string" ||
        typeof parsed.connected !== "boolean"
      ) {
        return;
      }

      setPresenceByCharacter((current) => ({
        ...current,
        [parsed.characterId]: parsed.connected,
      }));
    };

    const handlePartyClosed = () => {
      invalidateRoster();
      setStatus("closed");
      onClosedRef.current?.();
      controller.abort();
    };

    void fetchEventSource(partyStreamUrl(partyId), {
      credentials: "include",
      headers: embeddedSessionHeaders(),
      signal: controller.signal,
      // Keep the stream live in a backgrounded tab, matching native EventSource;
      // fetch-event-source otherwise drops the connection while hidden.
      openWhenHidden: true,
      async onopen(response) {
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType?.startsWith(EventStreamContentType)) {
          setStatus("open");
          invalidateRoster();
          return;
        }
        throw new FatalStreamError(
          `party stream open failed: ${response.status}`,
        );
      },
      onmessage(event) {
        switch (event.event) {
          case "character.updated":
            handleCharacterUpdated(event.data);
            break;
          case "character.joined":
          case "character.left":
          case "character.kicked":
            handleRosterEvent(event.data);
            break;
          case "party.presenceSnapshot":
            handlePresenceSnapshot(event.data);
            break;
          case "character.presence":
            handlePresenceEvent(event.data);
            break;
          case "party.linkRotated":
            invalidateRoster();
            break;
          case "party.closed":
            handlePartyClosed();
            break;
        }
      },
      onerror(err) {
        setStatus(err instanceof FatalStreamError ? "closed" : "error");
        if (err instanceof FatalStreamError) {
          throw err; // stop reconnecting
        }
        // returning undefined lets fetch-event-source retry with backoff
      },
    }).catch(() => {
      // Swallow terminal rejections (fatal open error / abort); status is set above.
    });

    return () => {
      controller.abort();
    };
  }, [enabled, partyId, queryClient]);

  return {
    status,
    changedFieldsByCharacter,
    presenceByCharacter,
    clearChangedFields,
  };
}
