import { client } from '@/api';
import type { CharacterResponse } from '@/hooks/models';
import { toApiClientError } from '@/utils/errorUtils';

export const DRAFT_SECTIONS = [
  'name',
  'stats',
  'omens',
  'silver',
  'origin',
  'abilities',
  'gear',
  'personality',
] as const;

export type DraftSection = (typeof DRAFT_SECTIONS)[number];
export type SectionSeeds = Record<DraftSection, string>;
export type AbilityStat = 'strength' | 'agility' | 'presence' | 'toughness';

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

type LooseClient = {
  POST: (path: string, init: { body?: unknown; signal?: AbortSignal }) => Promise<{
    data?: unknown;
    error?: unknown;
    response?: Response;
  }>;
  GET: (path: string, init?: { signal?: AbortSignal }) => Promise<{
    data?: unknown;
    error?: unknown;
    response?: Response;
  }>;
};

const loose = client as unknown as LooseClient;

async function unwrap<T>(
  call: Promise<{ data?: unknown; error?: unknown; response?: Response }>,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error, response } = await call;
  const responseOk = response?.ok ?? !error;
  if (error || !responseOk) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    throw toApiClientError(error, response, fallbackMessage);
  }
  if (data === undefined) {
    throw new Error(fallbackMessage);
  }
  return data as T;
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
): Promise<DraftResponse> {
  return unwrap<DraftResponse>(
    loose.POST(`/api/characters/draft?locale=${encodeURIComponent(locale)}`, {
      body: input,
      signal,
    }),
    'Failed to roll a draft',
    signal,
  );
}

export function rerollDraftSection(
  draft: CharacterDraft,
  section: DraftSection,
  locale: string,
  signal?: AbortSignal,
): Promise<DraftResponse> {
  return unwrap<DraftResponse>(
    loose.POST(
      `/api/characters/draft/reroll/${section}?locale=${encodeURIComponent(locale)}`,
      { body: { draft }, signal },
    ),
    'Failed to re-roll',
    signal,
  );
}

export function confirmDraft(
  draft: CharacterDraft,
  locale: string,
  signal?: AbortSignal,
  replace = false,
): Promise<CharacterResponse> {
  return unwrap<CharacterResponse>(
    loose.POST(`/api/characters/new?locale=${encodeURIComponent(locale)}`, {
      body: replace ? { draft, replace: true } : { draft },
      signal,
    }),
    'Failed to create character',
    signal,
  );
}

// Roll-and-keep: create a fully random character in one shot (no draft preview).
// Used by the "roll and join" flow so it can create + join imperatively.
export function createRandomCharacter(
  locale: string,
  signal?: AbortSignal,
): Promise<CharacterResponse> {
  return unwrap<CharacterResponse>(
    loose.POST(`/api/characters/new?locale=${encodeURIComponent(locale)}`, {
      body: {},
      signal,
    }),
    'Failed to roll a character',
    signal,
  );
}

export function fetchClasses(
  locale: string,
  signal?: AbortSignal,
): Promise<ClassSummary[]> {
  return unwrap<ClassSummary[]>(
    loose.GET(`/api/characters/classes?locale=${encodeURIComponent(locale)}`, { signal }),
    'Failed to load classes',
    signal,
  );
}
