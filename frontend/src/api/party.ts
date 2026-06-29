import { client } from '@/api';
import { toApiClientError } from '@/utils/errorUtils';

export type PartyRole = 'gm' | 'member';

export type PartyMemberSummary = {
  characterId: string;
  name: string;
  classId: number | null;
  currentHp: number;
  maxHp: number;
  joinedAt: string | null;
  owned?: boolean;
};

export type OwnedPartySummary = {
  id: string;
  name: string;
  inviteToken: string;
  invitePath: string;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
};

export type PartyDetail = OwnedPartySummary & {
  role: PartyRole;
  members: PartyMemberSummary[];
};

export type PartyJoinResult = {
  partyId: string;
  redirect: string;
};

export type PartyInviteSummary = {
  id: string;
  name: string;
  maxMembers: number;
};

type ApiResult<T> = {
  data?: T;
  error?: unknown;
  response?: Response;
};

type UntypedClient = {
  GET: <T>(path: string, init?: Record<string, unknown>) => Promise<ApiResult<T>>;
  POST: <T>(path: string, init?: Record<string, unknown>) => Promise<ApiResult<T>>;
  PATCH: <T>(path: string, init?: Record<string, unknown>) => Promise<ApiResult<T>>;
  DELETE: <T>(path: string, init?: Record<string, unknown>) => Promise<ApiResult<T>>;
};

const partyClient = client as unknown as UntypedClient;

export const partyKeys = {
  list: () => ['get', '/api/parties'] as const,
  detail: (partyId: string) =>
    ['get', '/api/parties/{id}', { params: { path: { id: partyId } } }] as const,
  invite: (token: string) =>
    ['get', '/api/parties/invite/{token}', { params: { path: { token } } }] as const,
  roster: () => ['get', '/api/characters'] as const,
  character: (characterId: string) =>
    [
      'get',
      '/api/characters/{id}',
      { params: { path: { id: characterId } } },
    ] as const,
};

async function unwrap<T>(
  result: ApiResult<T>,
  fallbackMessage: string
): Promise<T> {
  const responseOk = result.response?.ok ?? !result.error;
  if (result.error || !responseOk) {
    throw toApiClientError(result.error, result.response, fallbackMessage);
  }

  return result.data as T;
}

export async function listParties(): Promise<OwnedPartySummary[]> {
  return unwrap(
    await partyClient.GET<OwnedPartySummary[]>('/api/parties'),
    'Failed to load parties'
  );
}

export async function createParty(name: string): Promise<PartyDetail> {
  return unwrap(
    await partyClient.POST<PartyDetail>('/api/parties', {
      body: { name },
    }),
    'Failed to create party'
  );
}

export async function getParty(partyId: string): Promise<PartyDetail> {
  return unwrap(
    await partyClient.GET<PartyDetail>(`/api/parties/${partyId}`),
    'Failed to load party'
  );
}

export async function getPartyInvite(token: string): Promise<PartyInviteSummary> {
  return unwrap(
    await partyClient.GET<PartyInviteSummary>(
      `/api/parties/invite/${encodeURIComponent(token)}`
    ),
    'Failed to load party invite'
  );
}

export async function renameParty(input: {
  partyId: string;
  name: string;
}): Promise<{ id: string; name: string }> {
  return unwrap(
    await partyClient.PATCH<{ id: string; name: string }>(
      `/api/parties/${input.partyId}`,
      { body: { name: input.name } }
    ),
    'Failed to rename party'
  );
}

export async function regeneratePartyLink(
  partyId: string
): Promise<Pick<OwnedPartySummary, 'id' | 'invitePath' | 'inviteToken'>> {
  return unwrap(
    await partyClient.POST<Pick<OwnedPartySummary, 'id' | 'invitePath' | 'inviteToken'>>(
      `/api/parties/${partyId}/regenerate-link`
    ),
    'Failed to regenerate invite link'
  );
}

export async function disbandParty(partyId: string): Promise<void> {
  await unwrap<unknown>(
    await partyClient.DELETE<unknown>(`/api/parties/${partyId}`),
    'Failed to disband party'
  );
}

export async function kickPartyMember(input: {
  partyId: string;
  characterId: string;
}): Promise<void> {
  await unwrap<unknown>(
    await partyClient.POST<unknown>(`/api/parties/${input.partyId}/kick`, {
      body: { characterId: input.characterId },
    }),
    'Failed to remove party member'
  );
}

export async function leaveParty(input: {
  partyId: string;
  characterId: string;
}): Promise<void> {
  await unwrap<unknown>(
    await partyClient.POST<unknown>(`/api/parties/${input.partyId}/leave`, {
      body: { characterId: input.characterId },
    }),
    'Failed to leave party'
  );
}

export async function joinParty(input: {
  token: string;
  characterId: string;
}): Promise<PartyJoinResult> {
  return unwrap(
    await partyClient.POST<PartyJoinResult>('/api/parties/join', {
      body: input,
    }),
    'Failed to join party'
  );
}

export async function replacePartyMember(input: {
  partyId: string;
  oldCharacterId: string;
  newCharacterId: string;
}): Promise<PartyJoinResult> {
  return unwrap(
    await partyClient.POST<PartyJoinResult>(
      `/api/parties/${input.partyId}/replace-member`,
      {
        body: {
          oldCharacterId: input.oldCharacterId,
          newCharacterId: input.newCharacterId,
        },
      }
    ),
    'Failed to bind replacement to party'
  );
}
