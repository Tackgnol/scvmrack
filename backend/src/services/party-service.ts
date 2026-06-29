import crypto from 'node:crypto';
import {
  partyRepository,
  PartyFullError,
  type PartyMemberRow,
  type PartyWithMembers,
} from '../repositories/party-repository.js';
import { isValidUUID } from '../utils.js';
import {
  ApiHttpError,
  apiError,
  badRequest,
  notFound,
  unauthorized,
} from '../errors.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import type { PartyEventBus } from '../plugins/party-bus.js';

/**
 * Raw shared-auth session shape the party flows reason about. A GM is an
 * authenticated, non-anonymous account; a character owner is matched on the
 * account id (`user.id`) OR the anonymous session id (`session.id`). Decoupled
 * from Fastify so the service can be unit-tested with a plain object.
 */
export type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

const DEFAULT_PARTY_MAX_MEMBERS = 10;

/** Read the cap once at module load; clamp to a sane positive integer. */
const PARTY_MAX_MEMBERS = (() => {
  const raw = process.env.PARTY_MAX_MEMBERS;
  if (!raw) {
    return DEFAULT_PARTY_MAX_MEMBERS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_PARTY_MAX_MEMBERS;
  }
  return parsed;
})();

function newInviteToken(): string {
  return crypto.randomBytes(16).toString('base64url');
}

function invitePathFor(token: string): string {
  return `/join/${token}`;
}

function sessionUserId(session: AppSession): string | null {
  return session?.user?.id ?? null;
}

function sessionId(session: AppSession): string | null {
  return session?.session?.id ?? null;
}

/** A GM is a present, non-anonymous account. */
function isGm(session: AppSession): boolean {
  return Boolean(sessionUserId(session)) && session?.user?.isAnonymous !== true;
}

/**
 * A caller owns a character when the account id matches `userId` (account) OR
 * the anonymous session id matches `sessionId` (guest). Mirrors the app's
 * ownership-by-binding model.
 */
function ownsCharacter(
  session: AppSession,
  character: { userId: string | null; sessionId: string | null }
): boolean {
  const userId = sessionUserId(session);
  if (userId && character.userId === userId) {
    return true;
  }
  const sid = sessionId(session);
  if (sid && character.sessionId === sid) {
    return true;
  }
  return false;
}

export type PartyMemberPayload = {
  characterId: string;
  name: string;
  classId: number | null;
  currentHp: number;
  maxHp: number;
  joinedAt: Date | null;
  owned: boolean;
};

export type PartyManageViewPayload = {
  id: string;
  name: string;
  role: 'gm';
  inviteToken: string;
  invitePath: string;
  memberCount: number;
  maxMembers: number;
  members: PartyMemberPayload[];
  createdAt: Date;
  updatedAt: Date;
};

export type PartyReadViewPayload = Omit<
  PartyManageViewPayload,
  'role' | 'inviteToken' | 'invitePath'
> & {
  role: 'member';
};

export type PartyDetailPayload = PartyManageViewPayload | PartyReadViewPayload;

export type PartyInviteSummaryPayload = {
  id: string;
  name: string;
  maxMembers: number;
};

function toMemberPayload(
  member: PartyMemberRow,
  session: AppSession
): PartyMemberPayload {
  return {
    characterId: member.id,
    name: member.name,
    classId: member.classId,
    currentHp: member.currentHp,
    maxHp: member.maxHp,
    joinedAt: member.joinedAt,
    owned: ownsCharacter(session, member),
  };
}

function manageView(
  party: PartyWithMembers,
  session: AppSession
): PartyManageViewPayload {
  return {
    id: party.id,
    name: party.name,
    role: 'gm' as const,
    inviteToken: party.inviteToken,
    invitePath: invitePathFor(party.inviteToken),
    memberCount: party.members.length,
    maxMembers: PARTY_MAX_MEMBERS,
    members: party.members.map((member) => toMemberPayload(member, session)),
    createdAt: party.createdAt,
    updatedAt: party.updatedAt,
  };
}

function readView(
  party: PartyWithMembers,
  session: AppSession
): PartyReadViewPayload {
  // Members can see the roster but never the invite token.
  return {
    id: party.id,
    name: party.name,
    role: 'member' as const,
    memberCount: party.members.length,
    maxMembers: PARTY_MAX_MEMBERS,
    members: party.members.map((member) => toMemberPayload(member, session)),
    createdAt: party.createdAt,
    updatedAt: party.updatedAt,
  };
}

/**
 * Party business logic. Returns a stable {@link ServiceResult}: known failures
 * (auth, ownership, validation, not-found, conflict, gone) are returned as
 * `ApiHttpError` values; unexpected failures are mapped to a 5xx after logging.
 *
 * The mutating methods (join/leave/kick/regenerate/disband) are structured so a
 * later phase can drop a `partyBus.publish(...)` call in at the marked points
 * with no rework.
 */
export function createPartyService(
  log: ServiceLogger,
  partyBus?: PartyEventBus
) {
  /**
   * Resolve a party the caller must own. Returns an `ApiHttpError` for any
   * failure (invalid id, no session, not found, not owner) or `null` when the
   * caller owns it. Owner-only operations never leak the existence of a party
   * the caller doesn't own — both missing and not-owned collapse to 404.
   */
  async function ensureOwner(
    session: AppSession,
    id: string
  ): Promise<ApiHttpError | null> {
    if (!isValidUUID(id)) {
      return badRequest('INVALID_PARTY_ID', 'Invalid party ID');
    }
    const userId = sessionUserId(session);
    if (!userId) {
      return unauthorized();
    }
    const party = await partyRepository.getPartyById(id);
    if (!party || party.ownerUserId !== userId) {
      return notFound('PARTY_NOT_FOUND', 'Party not found');
    }
    return null;
  }

  return {
    maxMembers: PARTY_MAX_MEMBERS,

    async createParty(input: {
      session: AppSession;
      name?: string | null;
    }): Promise<ServiceResult<unknown>> {
      if (!isGm(input.session)) {
        return fail(unauthorized());
      }
      const ownerUserId = sessionUserId(input.session) as string;

      const name =
        typeof input.name === 'string' && input.name.trim().length > 0
          ? input.name.trim()
          : 'Untitled Warband';

      try {
        const party = await partyRepository.createParty({
          ownerUserId,
          name,
          inviteToken: newInviteToken(),
        });
        return ok({
          id: party.id,
          name: party.name,
          role: 'gm' as const,
          inviteToken: party.inviteToken,
          invitePath: invitePathFor(party.inviteToken),
          memberCount: 0,
          maxMembers: PARTY_MAX_MEMBERS,
          members: [],
          createdAt: party.createdAt,
          updatedAt: party.updatedAt,
        });
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_CREATE_FAILED', 'Failed to create party')
        );
      }
    },

    async listParties(input: {
      session: AppSession;
    }): Promise<ServiceResult<unknown>> {
      if (!isGm(input.session)) {
        return fail(unauthorized());
      }
      const ownerUserId = sessionUserId(input.session) as string;

      try {
        const parties = await partyRepository.listPartiesByOwner(ownerUserId);
        return ok(
          parties.map((party) => ({
            id: party.id,
            name: party.name,
            inviteToken: party.inviteToken,
            invitePath: invitePathFor(party.inviteToken),
            memberCount: party.memberCount,
            maxMembers: PARTY_MAX_MEMBERS,
            createdAt: party.createdAt,
            updatedAt: party.updatedAt,
          }))
        );
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_LIST_FAILED', 'Failed to list parties')
        );
      }
    },

    async getParty(input: {
      session: AppSession;
      id: string;
    }): Promise<ServiceResult<PartyDetailPayload>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_PARTY_ID', 'Invalid party ID'));
      }

      try {
        const party = await partyRepository.getPartyById(input.id);
        // Never leak existence: a missing party and a party the caller can't
        // see both return the same 404.
        if (!party) {
          return fail(notFound('PARTY_NOT_FOUND', 'Party not found'));
        }

        const userId = sessionUserId(input.session);
        if (userId && party.ownerUserId === userId) {
          return ok(manageView(party, input.session));
        }

        const isMember = party.members.some((member) =>
          ownsCharacter(input.session, member)
        );
        if (isMember) {
          return ok(readView(party, input.session));
        }

        return fail(notFound('PARTY_NOT_FOUND', 'Party not found'));
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_FETCH_FAILED', 'Failed to fetch party')
        );
      }
    },

    async getInvite(input: {
      token: string;
    }): Promise<ServiceResult<PartyInviteSummaryPayload>> {
      if (typeof input.token !== 'string' || input.token.length === 0) {
        return fail(
          apiError(
            410,
            'PARTY_INVITE_INVALID',
            'This invite link is no longer valid'
          )
        );
      }

      try {
        const party = await partyRepository.getPartyByInviteToken(input.token);
        if (!party) {
          return fail(
            apiError(
              410,
              'PARTY_INVITE_INVALID',
              'This invite link is no longer valid'
            )
          );
        }

        return ok({
          id: party.id,
          name: party.name,
          maxMembers: PARTY_MAX_MEMBERS,
        });
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'PARTY_INVITE_FETCH_FAILED',
            'Failed to fetch party invite'
          )
        );
      }
    },

    async renameParty(input: {
      session: AppSession;
      id: string;
      name: string;
    }): Promise<ServiceResult<unknown>> {
      const denied = await ensureOwner(input.session, input.id);
      if (denied) {
        return fail(denied);
      }

      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (name.length === 0) {
        return fail(badRequest('INVALID_PARTY_NAME', 'Party name is required'));
      }

      try {
        await partyRepository.renameParty(input.id, name);
        return ok({ id: input.id, name });
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_RENAME_FAILED', 'Failed to rename party')
        );
      }
    },

    async regenerateLink(input: {
      session: AppSession;
      id: string;
    }): Promise<ServiceResult<unknown>> {
      const denied = await ensureOwner(input.session, input.id);
      if (denied) {
        return fail(denied);
      }

      try {
        const token = newInviteToken();
        await partyRepository.rotateInviteToken(input.id, token);
        partyBus?.publish(input.id, { type: 'party.linkRotated' });
        return ok({
          id: input.id,
          inviteToken: token,
          invitePath: invitePathFor(token),
        });
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'PARTY_REGENERATE_FAILED',
            'Failed to regenerate invite link'
          )
        );
      }
    },

    async disbandParty(input: {
      session: AppSession;
      id: string;
    }): Promise<ServiceResult<void>> {
      const denied = await ensureOwner(input.session, input.id);
      if (denied) {
        return fail(denied);
      }

      try {
        await partyRepository.deleteParty(input.id);
        partyBus?.publish(input.id, { type: 'party.closed' });
        return ok(undefined);
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'PARTY_DISBAND_FAILED',
            'Failed to disband party'
          )
        );
      }
    },

    async joinParty(input: {
      session: AppSession;
      token: string;
      characterId: string;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.characterId)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }
      if (typeof input.token !== 'string' || input.token.length === 0) {
        // An empty/absent token can never resolve a party — treat as gone.
        return fail(
          apiError(
            410,
            'PARTY_INVITE_INVALID',
            'This invite link is no longer valid'
          )
        );
      }

      try {
        const party = await partyRepository.getPartyByInviteToken(input.token);
        // Invalid or rotated token → 410 Gone.
        if (!party) {
          return fail(
            apiError(
              410,
              'PARTY_INVITE_INVALID',
              'This invite link is no longer valid'
            )
          );
        }

        const character = await partyRepository.getCharacterForJoin(
          input.characterId
        );
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        // Must own the character being bound.
        if (!ownsCharacter(input.session, character)) {
          return fail(
            apiError(
              403,
              'CHARACTER_ACCESS_DENIED',
              "You don't have access to this scvm"
            )
          );
        }
        // The GM does not play in their own party (v1).
        const userId = sessionUserId(input.session);
        if (userId && party.ownerUserId === userId) {
          return fail(
            apiError(
              403,
              'PARTY_OWNER_CANNOT_JOIN',
              'A game master cannot join their own party'
            )
          );
        }
        // Already in THIS party → idempotent success.
        if (character.partyId === party.id) {
          return ok({
            partyId: party.id,
            redirect: `/party/${party.id}/character/${character.id}`,
          });
        }
        // In ANOTHER party → conflict (FE offers leave + rejoin).
        if (character.partyId) {
          return fail(
            apiError(
              409,
              'CHARACTER_IN_ANOTHER_PARTY',
              'This scvm already belongs to another party'
            )
          );
        }

        // Cap is enforced inside the transaction so concurrent joins can't
        // overflow it.
        await partyRepository.joinInTransaction({
          characterId: character.id,
          partyId: party.id,
          cap: PARTY_MAX_MEMBERS,
        });
        partyBus?.publish(party.id, {
          type: 'character.joined',
          characterId: character.id,
        });

        return ok({
          partyId: party.id,
          redirect: `/party/${party.id}/character/${character.id}`,
        });
      } catch (err) {
        if (err instanceof PartyFullError) {
          return fail(apiError(409, 'PARTY_FULL', 'This party is full'));
        }
        return fail(
          unexpected(log, err, 'PARTY_JOIN_FAILED', 'Failed to join party')
        );
      }
    },

    async replaceMember(input: {
      session: AppSession;
      id: string;
      oldCharacterId: string;
      newCharacterId: string;
    }): Promise<ServiceResult<unknown>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_PARTY_ID', 'Invalid party ID'));
      }
      if (
        !isValidUUID(input.oldCharacterId) ||
        !isValidUUID(input.newCharacterId)
      ) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }
      if (input.oldCharacterId === input.newCharacterId) {
        return fail(
          badRequest(
            'INVALID_REPLACEMENT_CHARACTER',
            'Replacement character must be different'
          )
        );
      }

      try {
        const [oldCharacter, newCharacter] = await Promise.all([
          partyRepository.getCharacterForJoin(input.oldCharacterId),
          partyRepository.getCharacterForJoin(input.newCharacterId),
        ]);

        if (!oldCharacter || !newCharacter) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        if (
          !ownsCharacter(input.session, oldCharacter) ||
          !ownsCharacter(input.session, newCharacter)
        ) {
          return fail(
            apiError(
              403,
              'CHARACTER_ACCESS_DENIED',
              "You don't have access to this scvm"
            )
          );
        }
        if (oldCharacter.partyId !== input.id) {
          return fail(
            notFound('PARTY_MEMBERSHIP_NOT_FOUND', 'Membership not found')
          );
        }
        if (newCharacter.partyId && newCharacter.partyId !== input.id) {
          return fail(
            apiError(
              409,
              'CHARACTER_IN_ANOTHER_PARTY',
              'This scvm already belongs to another party'
            )
          );
        }

        if (newCharacter.partyId !== input.id) {
          await partyRepository.setCharacterParty(newCharacter.id, input.id);
          partyBus?.publish(input.id, {
            type: 'character.joined',
            characterId: newCharacter.id,
          });
        }

        return ok({
          partyId: input.id,
          redirect: `/party/${input.id}/character/${newCharacter.id}`,
        });
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'PARTY_REPLACEMENT_FAILED',
            'Failed to bind replacement to party'
          )
        );
      }
    },

    async leaveParty(input: {
      session: AppSession;
      id: string;
      characterId: string;
    }): Promise<ServiceResult<void>> {
      if (!isValidUUID(input.id)) {
        return fail(badRequest('INVALID_PARTY_ID', 'Invalid party ID'));
      }
      if (!isValidUUID(input.characterId)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      try {
        const character = await partyRepository.getCharacterForJoin(
          input.characterId
        );
        if (!character) {
          return fail(notFound('CHARACTER_NOT_FOUND', 'Character not found'));
        }
        if (!ownsCharacter(input.session, character)) {
          return fail(
            apiError(
              403,
              'CHARACTER_ACCESS_DENIED',
              "You don't have access to this scvm"
            )
          );
        }
        // The character must actually be in this party to leave it.
        if (character.partyId !== input.id) {
          return fail(
            notFound('PARTY_MEMBERSHIP_NOT_FOUND', 'Membership not found')
          );
        }

        await partyRepository.setCharacterParty(character.id, null);
        partyBus?.publish(input.id, {
          type: 'character.left',
          characterId: character.id,
        });
        return ok(undefined);
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_LEAVE_FAILED', 'Failed to leave party')
        );
      }
    },

    async kick(input: {
      session: AppSession;
      id: string;
      characterId: string;
    }): Promise<ServiceResult<void>> {
      if (!isValidUUID(input.characterId)) {
        return fail(badRequest('INVALID_CHARACTER_ID', 'Invalid character ID'));
      }

      const denied = await ensureOwner(input.session, input.id);
      if (denied) {
        return fail(denied);
      }

      try {
        const character = await partyRepository.getCharacterForJoin(
          input.characterId
        );
        // The member must be in this party to be kicked.
        if (!character || character.partyId !== input.id) {
          return fail(
            notFound('PARTY_MEMBERSHIP_NOT_FOUND', 'Membership not found')
          );
        }

        await partyRepository.setCharacterParty(character.id, null);
        partyBus?.publish(input.id, {
          type: 'character.kicked',
          characterId: character.id,
        });
        return ok(undefined);
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_KICK_FAILED', 'Failed to remove member')
        );
      }
    },
  };
}
