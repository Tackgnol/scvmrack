import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { advisoryLock } from './advisory-lock.js';
import { characterTxOps } from './character-tx.js';
import {
  roomParticipationOps,
  type RoomParticipationOps,
} from './room-participation-repository.js';

/** The party a seat change works on, as read while its locks are held. */
export type SeatParty = {
  id: string;
  ownerUserId: string;
  obrRoomId: string | null;
};

/** A seat that does not count against the cap because its holder is leaving as the new scvm arrives. */
export type FreedSeat = { userId: string } | { characterId: string };

const SEAT_PARTY_SELECT = {
  id: true,
  ownerUserId: true,
  obrRoomId: true,
} as const;

/** Seat reads and writes bound to one transaction that holds the party's locks. */
function seatOps(tx: Prisma.TransactionClient) {
  const characters = characterTxOps(tx);
  return {
    /** How many scvm hold a seat in the party, not counting the `freed` one(s). */
    countSeats(partyId: string, freed?: FreedSeat): Promise<number> {
      return tx.character.count({
        where: {
          partyId,
          // NOT alone would also skip owner-less scvm (user_id NULL), which still hold a seat.
          ...(freed && 'userId' in freed
            ? { OR: [{ userId: null }, { NOT: { userId: freed.userId } }] }
            : {}),
          ...(freed && 'characterId' in freed
            ? { NOT: { id: freed.characterId } }
            : {}),
        },
      });
    },

    async seat(characterId: string, partyId: string): Promise<void> {
      await tx.character.update({
        where: { id: characterId },
        data: { partyId, joinedAt: new Date() },
      });
    },

    /** Inserts a new scvm already seated in the party and returns its id. */
    createSeated(
      data: Prisma.CharacterUncheckedCreateInput,
      partyId: string
    ): Promise<string> {
      return characters.createCharacter({
        ...data,
        partyId,
        joinedAt: new Date(),
      });
    },

    deleteCharactersOf: characters.deleteCharactersOf,

    bindObrPlayer: characters.bindObrPlayer,

    /** Clears the scvm's seat if it still sits in `partyId`; true when it did. */
    async unseat(characterId: string, partyId: string): Promise<boolean> {
      const { count } = await tx.character.updateMany({
        where: { id: characterId, partyId },
        data: { partyId: null, joinedAt: null },
      });
      return count > 0;
    },

    async clearRoomBindings(characterId: string, roomId: string): Promise<void> {
      await tx.obrPlayerCharacterBinding.deleteMany({
        where: { obrRoomId: roomId, characterId },
      });
      await tx.obrTokenCharacterBinding.deleteMany({
        where: { obrRoomId: roomId, characterId },
      });
    },

    /** Deletes the scvm; true when it existed. */
    async deleteCharacter(characterId: string): Promise<boolean> {
      const { count } = await tx.character.deleteMany({
        where: { id: characterId },
      });
      return count > 0;
    },
  };
}

export type SeatOps = ReturnType<typeof seatOps>;

/**
 * Seat transactions. Every seat change takes the party's lock and then, when the
 * party has an Owlbear room, the room's lock: always in that order, the same
 * order attaching a room uses.
 */
export const partyMembershipRepository = {
  /** Runs `work` under the party's locks. `party` is null when the party no longer exists. */
  inParty<T>(
    partyId: string,
    work: (party: SeatParty | null, ops: SeatOps) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(async (tx) => {
      await advisoryLock(tx, 'party', partyId);
      const party = await tx.party.findUnique({
        where: { id: partyId },
        select: SEAT_PARTY_SELECT,
      });
      if (party?.obrRoomId) {
        await advisoryLock(tx, 'room', party.obrRoomId);
      }
      return work(party, seatOps(tx));
    });
  },

  /**
   * Runs `work` under the locks of the room's party and then the room, with the
   * room's participation ops. `party` is the room's party as read under the room
   * lock, or null when the room has none.
   */
  inRoom<T>(
    roomId: string,
    work: (
      party: SeatParty | null,
      ops: SeatOps,
      room: RoomParticipationOps
    ) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(async (tx) => {
      const before = await tx.party.findUnique({
        where: { obrRoomId: roomId },
        select: { id: true },
      });
      if (before) {
        await advisoryLock(tx, 'party', before.id);
      }
      await advisoryLock(tx, 'room', roomId);
      // A room re-pointed between the two reads is still safe: every seat change
      // in its new party also takes this room's lock.
      const party = await tx.party.findUnique({
        where: { obrRoomId: roomId },
        select: SEAT_PARTY_SELECT,
      });
      return work(party, seatOps(tx), roomParticipationOps(tx, roomId));
    });
  },
};
