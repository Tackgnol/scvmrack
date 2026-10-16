import { client } from "@/api";
import type { ApiResult } from "@/api/clientResult";
import type { CharacterResponse } from "@/hooks/models";
import { toApiClientError } from "@/utils/errorUtils";

export const DRAFT_SECTIONS = [
  "name",
  "stats",
  "omens",
  "silver",
  "origin",
  "abilities",
  "gear",
  "personality",
] as const;

export type DraftSection = (typeof DRAFT_SECTIONS)[number];
export type SectionSeeds = Record<DraftSection, string>;
export type AbilityStat = "strength" | "agility" | "presence" | "toughness";

export type ClasslessStatOption = {
  ability: AbilityStat;
  dice: number[];
  minTotal: number;
  maxTotal: number;
  selected: boolean;
};

export type CharacterDraft = {
  classId: number | null;
  classless: boolean;
  name?: string;
  dropLowestAbilities?: AbilityStat[];
  seeds: SectionSeeds;
};

export type DraftResponse = {
  draft: CharacterDraft;
  preview: CharacterResponse;
  classlessStatOptions?: ClasslessStatOption[];
};

export type ClassSummary = {
  id: number;
  name: string | null;
  description: string | null;
};

/** The classes a roll may use, and whether it may go classless instead. */
export type ClassList = { classes: ClassSummary[]; classlessEnabled: boolean };

type LooseClient = {
  POST: (
    path: string,
    init: { body?: unknown; signal?: AbortSignal },
  ) => Promise<ApiResult>;
  GET: (path: string, init?: { signal?: AbortSignal }) => Promise<ApiResult>;
};

const loose = client as unknown as LooseClient;

async function unwrap<T>(
  call: Promise<ApiResult>,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error, response } = await call;
  const responseOk = response?.ok ?? !error;
  if (error || !responseOk) {
    if (signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    throw toApiClientError(error, response, fallbackMessage);
  }
  if (data === undefined) {
    throw new Error(fallbackMessage);
  }
  return data as T;
}

/** Query string for a creation call: the locale, plus its party or Owlbear room scope. */
function creationQuery(locale: string, inviteToken?: string, obrRoomId?: string, obrPlayerId?: string): string {
  const invite = inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : "";
  const room = obrRoomId ? `&obrRoom=${encodeURIComponent(obrRoomId)}` : "";
  const player = obrPlayerId ? `&obrPlayer=${encodeURIComponent(obrPlayerId)}` : "";
  return `?locale=${encodeURIComponent(locale)}${invite}${room}${player}`;
}

export function createDraft(
  input: {
    classId?: number | null;
    classless?: boolean;
    name?: string;
    dropLowestAbilities?: AbilityStat[];
    seeds?: SectionSeeds;
  },
  locale: string,
  signal?: AbortSignal,
  inviteToken?: string,
  obrRoomId?: string,
  obrPlayerId?: string,
): Promise<DraftResponse> {
  return unwrap<DraftResponse>(
    loose.POST(`/api/characters/draft${creationQuery(locale, inviteToken, obrRoomId, obrPlayerId)}`, {
      body: input,
      signal,
    }),
    "Failed to roll a draft",
    signal,
  );
}

export function rerollDraftSection(
  draft: CharacterDraft,
  section: DraftSection,
  locale: string,
  signal?: AbortSignal,
  inviteToken?: string,
  obrRoomId?: string,
  obrPlayerId?: string,
): Promise<DraftResponse> {
  return unwrap<DraftResponse>(
    loose.POST(
      `/api/characters/draft/reroll/${section}${creationQuery(locale, inviteToken, obrRoomId, obrPlayerId)}`,
      { body: { draft }, signal },
    ),
    "Failed to re-roll",
    signal,
  );
}

export function confirmDraft(
  draft: CharacterDraft,
  locale: string,
  signal?: AbortSignal,
  replace = false,
  inviteToken?: string,
  obrRoomId?: string,
  obrPlayerId?: string,
): Promise<CharacterResponse> {
  return unwrap<CharacterResponse>(
    loose.POST(`/api/characters/new${creationQuery(locale, inviteToken, obrRoomId, obrPlayerId)}`, {
      body: replace ? { draft, replace: true } : { draft },
      signal,
    }),
    "Failed to create character",
    signal,
  );
}

export function fetchClasses(
  locale: string,
  signal?: AbortSignal,
  inviteToken?: string,
  obrRoomId?: string,
  obrPlayerId?: string,
): Promise<ClassList> {
  return unwrap<ClassList>(
    loose.GET(`/api/characters/classes${creationQuery(locale, inviteToken, obrRoomId, obrPlayerId)}`, {
      signal,
    }),
    "Failed to load classes",
    signal,
  );
}
