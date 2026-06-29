import {
  createParty,
  disbandParty,
  getParty,
  getPartyInvite,
  joinParty,
  kickPartyMember,
  leaveParty,
  listParties,
  partyKeys,
  regeneratePartyLink,
  renameParty,
  type PartyDetail,
} from '@/api/party';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function usePartyList(enabled = true) {
  return useQuery({
    queryKey: partyKeys.list(),
    queryFn: listParties,
    enabled,
  });
}

export function usePartyDetail(partyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: partyId ? partyKeys.detail(partyId) : ['get', '/api/parties/{id}', 'none'],
    queryFn: () => getParty(partyId as string),
    enabled: enabled && !!partyId,
  });
}

export function usePartyInvite(token: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: token ? partyKeys.invite(token) : ['get', '/api/parties/invite/{token}', 'none'],
    queryFn: () => getPartyInvite(token as string),
    enabled: enabled && !!token,
    retry: false,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createParty,
    onSuccess: (party) => {
      queryClient.setQueryData(partyKeys.detail(party.id), party);
      void queryClient.invalidateQueries({ queryKey: partyKeys.list() });
    },
  });
}

export function useRenameParty(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameParty({ partyId, name }),
    onSuccess: (result) => {
      queryClient.setQueryData<PartyDetail | undefined>(
        partyKeys.detail(partyId),
        (current) => (current ? { ...current, name: result.name } : current)
      );
      void queryClient.invalidateQueries({ queryKey: partyKeys.list() });
    },
  });
}

export function useRegeneratePartyLink(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => regeneratePartyLink(partyId),
    onSuccess: (result) => {
      queryClient.setQueryData<PartyDetail | undefined>(
        partyKeys.detail(partyId),
        (current) =>
          current
            ? {
                ...current,
                invitePath: result.invitePath,
                inviteToken: result.inviteToken,
              }
            : current
      );
      void queryClient.invalidateQueries({ queryKey: partyKeys.list() });
    },
  });
}

export function useKickPartyMember(partyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) => kickPartyMember({ partyId, characterId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyId) });
      void queryClient.invalidateQueries({ queryKey: partyKeys.roster() });
    },
  });
}

export function useDisbandParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disbandParty,
    onSuccess: (_result, partyId) => {
      queryClient.removeQueries({ queryKey: partyKeys.detail(partyId) });
      void queryClient.invalidateQueries({ queryKey: partyKeys.list() });
      void queryClient.invalidateQueries({ queryKey: partyKeys.roster() });
    },
  });
}

export function useLeaveParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveParty,
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: partyKeys.detail(variables.partyId) });
      void queryClient.invalidateQueries({ queryKey: partyKeys.roster() });
      void queryClient.invalidateQueries({ queryKey: ['party', 'join', 'characters'] });
    },
  });
}

export function useJoinParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinParty,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: partyKeys.detail(result.partyId) });
      void queryClient.invalidateQueries({ queryKey: partyKeys.roster() });
    },
  });
}
