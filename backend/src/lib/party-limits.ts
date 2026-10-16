import { apiError } from '../errors.js';
import type { CharacterTxOps } from '../repositories/character-repository.js';
import { positiveIntFromEnv } from './env-int.js';

/** Party member cap, read once at module load from PARTY_MAX_MEMBERS. */
export const PARTY_MAX_MEMBERS = positiveIntFromEnv('PARTY_MAX_MEMBERS', 10);

export const partyFull = () => apiError(409, 'PARTY_FULL', 'This party is full');

/**
 * Takes the party's join lock for the rest of the transaction and reports whether it still has a free seat.
 * `replacingUserId`'s scvm don't count: they leave as the new one joins.
 */
export async function lockPartySeat(
  ops: Pick<CharacterTxOps, 'lockParty' | 'countPartyMembers'>,
  partyId: string,
  replacingUserId?: string
): Promise<boolean> {
  await ops.lockParty(partyId);
  return (await ops.countPartyMembers(partyId, replacingUserId)) < PARTY_MAX_MEMBERS;
}
