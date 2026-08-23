import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";

export type PartyRole = "gm" | "member";

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

export type PartyDetail = Omit<
  OwnedPartySummary,
  "inviteToken" | "invitePath"
> & {
  role: PartyRole;
  members: PartyMemberSummary[];
  // Owner-only: absent when the backend returns the token-less room view.
  inviteToken?: string;
  invitePath?: string;
};

export type PartyJoinResult = {
  partyId: string;
  redirect: string;
};

export type PromoteObrRoomInput = {
  obrRoomId: string;
  name?: string;
};

export type PartyInviteSummary = {
  id: string;
  name: string;
  maxMembers: number;
};

export type PartyLimits = {
  maxMembers: number;
};

export type PartyMiseriesResult = {
  miseryCount: number;
  updatedCharacters: number;
};

const partyClient = client as unknown as UntypedApiClient;

export const partyKeys = {
  limits: () => ["get", "/api/parties/limits"] as const,
  list: () => ["get", "/api/parties"] as const,
  detail: (partyId: string) =>
    [
      "get",
      "/api/parties/{id}",
      { params: { path: { id: partyId } } },
    ] as const,
  obrRoom: (roomId: string) => ["party", "obr-room", roomId] as const,
  invite: (token: string) =>
    [
      "get",
      "/api/parties/invite/{token}",
      { params: { path: { token } } },
    ] as const,
  roster: () => ["get", "/api/characters"] as const,
  character: (characterId: string) =>
    [
      "get",
      "/api/characters/{id}",
      { params: { path: { id: characterId } } },
    ] as const,
};

export async function getPartyLimits(): Promise<PartyLimits> {
  return unwrapApiResult(
    await partyClient.GET<PartyLimits>("/api/parties/limits"),
    "Failed to load party limits",
  );
}

export async function listParties(): Promise<OwnedPartySummary[]> {
  return unwrapApiResult(
    await partyClient.GET<OwnedPartySummary[]>("/api/parties"),
    "Failed to load parties",
  );
}

export async function createParty(name: string): Promise<PartyDetail> {
  return unwrapApiResult(
    await partyClient.POST<PartyDetail>("/api/parties", {
      body: { name },
    }),
    "Failed to create party",
  );
}

export async function promoteObrRoom(
  input: PromoteObrRoomInput,
): Promise<PartyDetail> {
  return unwrapApiResult(
    await partyClient.POST<PartyDetail>("/api/parties/promote", {
      body: input,
    }),
    "Failed to save Owlbear room party",
  );
}

export async function attachPartyRoom(
  partyId: string,
  obrRoomId: string,
): Promise<{ id: string; obrRoomId: string }> {
  return unwrapApiResult(
    await partyClient.POST<{ id: string; obrRoomId: string }>(
      `/api/parties/${partyId}/attach-room`,
      { body: { obrRoomId } },
    ),
    "Failed to attach this Owlbear room",
  );
}

export async function getParty(partyId: string): Promise<PartyDetail> {
  return unwrapApiResult(
    await partyClient.GET<PartyDetail>(`/api/parties/${partyId}`),
    "Failed to load party",
  );
}

export async function getPartyInvite(
  token: string,
): Promise<PartyInviteSummary> {
  return unwrapApiResult(
    await partyClient.GET<PartyInviteSummary>(
      `/api/parties/invite/${encodeURIComponent(token)}`,
    ),
    "Failed to load party invite",
  );
}

export async function renameParty(input: {
  partyId: string;
  name: string;
}): Promise<{ id: string; name: string }> {
  return unwrapApiResult(
    await partyClient.PATCH<{ id: string; name: string }>(
      `/api/parties/${input.partyId}`,
      { body: { name: input.name } },
    ),
    "Failed to rename party",
  );
}

export async function setPartyMiseries(input: {
  partyId: string;
  miseryCount: number;
}): Promise<PartyMiseriesResult> {
  return unwrapApiResult(
    await partyClient.PUT<PartyMiseriesResult>(
      `/api/parties/${input.partyId}/miseries`,
      { body: { miseryCount: input.miseryCount } },
    ),
    "Failed to update party Miseries",
  );
}

export async function regeneratePartyLink(
  partyId: string,
): Promise<Pick<OwnedPartySummary, "id" | "invitePath" | "inviteToken">> {
  return unwrapApiResult(
    await partyClient.POST<
      Pick<OwnedPartySummary, "id" | "invitePath" | "inviteToken">
    >(`/api/parties/${partyId}/regenerate-link`),
    "Failed to regenerate invite link",
  );
}

export async function disbandParty(partyId: string): Promise<void> {
  await unwrapApiResult<unknown>(
    await partyClient.DELETE<unknown>(`/api/parties/${partyId}`),
    "Failed to disband party",
  );
}

export async function kickPartyMember(input: {
  partyId: string;
  characterId: string;
}): Promise<void> {
  await unwrapApiResult<unknown>(
    await partyClient.POST<unknown>(`/api/parties/${input.partyId}/kick`, {
      body: { characterId: input.characterId },
    }),
    "Failed to remove party member",
  );
}

export async function leaveParty(input: {
  partyId: string;
  characterId: string;
}): Promise<void> {
  await unwrapApiResult<unknown>(
    await partyClient.POST<unknown>(`/api/parties/${input.partyId}/leave`, {
      body: { characterId: input.characterId },
    }),
    "Failed to leave party",
  );
}

export async function joinParty(input: {
  token: string;
  characterId: string;
}): Promise<PartyJoinResult> {
  return unwrapApiResult(
    await partyClient.POST<PartyJoinResult>("/api/parties/join", {
      body: input,
    }),
    "Failed to join party",
  );
}

export async function replacePartyMember(input: {
  partyId: string;
  oldCharacterId: string;
  newCharacterId: string;
}): Promise<PartyJoinResult> {
  return unwrapApiResult(
    await partyClient.POST<PartyJoinResult>(
      `/api/parties/${input.partyId}/replace-member`,
      {
        body: {
          oldCharacterId: input.oldCharacterId,
          newCharacterId: input.newCharacterId,
        },
      },
    ),
    "Failed to bind replacement to party",
  );
}
