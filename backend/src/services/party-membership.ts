import type { Prisma } from '@prisma/client';
import { apiError, notFound, type ApiHttpError } from '../errors.js';
import { positiveIntFromEnv } from '../lib/env-int.js';
import type { PartyEvent, PartyEventBus } from '../plugins/party-bus.js';
import {
  partyMembershipRepository,
  type FreedSeat,
} from '../repositories/party-membership-repository.js';
import type { RoomParticipationOps } from '../repositories/room-participation-repository.js';
import { fail, ok, type ServiceResult } from './result.js';

/** Party member cap, read once at module load from PARTY_MAX_MEMBERS. */
export const PARTY_MAX_MEMBERS = positiveIntFromEnv('PARTY_MAX_MEMBERS', 10);

const partyFull = () => apiError(409, 'PARTY_FULL', 'This party is full');

/** The refusal for `userId` taking a seat in a party they run as GM, or null when they may. */
export function ownerCannotJoin(
  party: { ownerUserId: string },
  userId: string | null
): ApiHttpError | null {
  if (userId && party.ownerUserId === userId) {
    return apiError(
      403,
      'PARTY_OWNER_CANNOT_JOIN',
      'A game master cannot join their own party'
    );
  }
  return null;
}

export type TakeSeat = {
  partyId: string;
  /** The account taking the seat, checked against the party's GM. */
  userId: string | null;
} & (
  | {
      /** An existing scvm. */
      characterId: string;
      /** A member this scvm replaces: its seat does not count against the cap. */
      replacing?: string;
    }
  | {
      /** A new scvm, inserted already seated. */
      create: Prisma.CharacterUncheckedCreateInput;
      obrBinding?: { roomId: string; playerId: string };
      /** A guest whose scvm are deleted as this one is forged: their seats do not count. */
      replacingGuest?: string;
    }
);

/** Why a scvm gives up its seat. `deleted` deletes the scvm with it. */
export type SeatReason = 'left' | 'kicked' | 'deleted';

const ROSTER_EVENT: Record<SeatReason, 'character.left' | 'character.kicked'> = {
  left: 'character.left',
  kicked: 'character.kicked',
  deleted: 'character.left',
};

/** Room removal's handle on seats while the room's locks are held. */
export type RoomSeat = {
  /** Clears the scvm's seat in the room's party and its bindings in the room; announced after commit. */
  giveUp(characterId: string, reason: 'left' | 'kicked'): Promise<void>;
};

function freedSeat(input: TakeSeat): FreedSeat | undefined {
  if ('create' in input) {
    return input.replacingGuest ? { userId: input.replacingGuest } : undefined;
  }
  return input.replacing ? { characterId: input.replacing } : undefined;
}

/**
 * A scvm's seat in a party: the only code that writes `characters.party_id`
 * (disbanding a party unseats its members through the foreign key). Owns the
 * member cap, the GM-does-not-play rule, the party and room locks, room binding
 * cleanup on leaving, and the roster event each change publishes once.
 * Unexpected failures are thrown for the caller to map.
 */
export function createPartyMembership(bus?: PartyEventBus) {
  function announce(partyId: string, event: PartyEvent): void {
    bus?.publish(partyId, event);
  }

  return {
    /** Seats an existing or new scvm; returns its id, or the refusal when the party is full or run by `userId`. */
    async takeSeat(input: TakeSeat): Promise<ServiceResult<string>> {
      const seated = await partyMembershipRepository.inParty(
        input.partyId,
        async (party, ops): Promise<ServiceResult<string>> => {
          // An empty system room party can be replaced by an attach between the
          // caller's read and this lock.
          if (!party) {
            return fail(notFound('PARTY_NOT_FOUND', 'Party not found'));
          }
          const refusal = ownerCannotJoin(party, input.userId);
          if (refusal) {
            return fail(refusal);
          }
          const taken = await ops.countSeats(input.partyId, freedSeat(input));
          if (taken >= PARTY_MAX_MEMBERS) {
            return fail(partyFull());
          }
          if (!('create' in input)) {
            await ops.seat(input.characterId, input.partyId);
            return ok(input.characterId);
          }
          if (input.replacingGuest) {
            await ops.deleteCharactersOf(input.replacingGuest);
          }
          const characterId = await ops.createSeated(input.create, input.partyId);
          if (input.obrBinding) {
            await ops.bindObrPlayer(input.obrBinding, characterId);
          }
          return ok(characterId);
        }
      );
      if (seated.ok) {
        announce(input.partyId, {
          type: 'character.joined',
          characterId: seated.value,
        });
      }
      return seated;
    },

    /**
     * Gives up the scvm's seat in `partyId` (clearing its bindings in the party's
     * room, if any), or deletes the scvm for `deleted`. True when that happened.
     */
    async giveUpSeat(input: {
      partyId: string;
      characterId: string;
      reason: SeatReason;
    }): Promise<boolean> {
      const changed = await partyMembershipRepository.inParty(
        input.partyId,
        async (party, ops) => {
          if (input.reason === 'deleted') {
            return ops.deleteCharacter(input.characterId);
          }
          const vacated = await ops.unseat(input.characterId, input.partyId);
          if (vacated && party?.obrRoomId) {
            await ops.clearRoomBindings(input.characterId, party.obrRoomId);
          }
          return vacated;
        }
      );
      if (changed) {
        announce(input.partyId, {
          type: ROSTER_EVENT[input.reason],
          characterId: input.characterId,
        });
      }
      return changed;
    },

    /**
     * Runs a room removal under the seat locks of the room's party: `work` applies
     * the room's own policy with `room` and gives up seats through `seat`.
     */
    async inRoom<T>(
      roomId: string,
      work: (room: RoomParticipationOps, seat: RoomSeat) => Promise<T>
    ): Promise<T> {
      const events: Array<{ partyId: string; event: PartyEvent }> = [];
      const result = await partyMembershipRepository.inRoom(
        roomId,
        (party, ops, room) =>
          work(room, {
            async giveUp(characterId, reason) {
              if (party) {
                await ops.unseat(characterId, party.id);
              }
              await ops.clearRoomBindings(characterId, roomId);
              if (party) {
                events.push({
                  partyId: party.id,
                  event: { type: ROSTER_EVENT[reason], characterId },
                });
              }
            },
          })
      );
      for (const { partyId, event } of events) {
        announce(partyId, event);
      }
      return result;
    },
  };
}

export type PartyMembership = ReturnType<typeof createPartyMembership>;
