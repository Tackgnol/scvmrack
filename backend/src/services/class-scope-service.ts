import { apiError } from '../errors.js';
import type { ClassScope } from './class-choice.js';

import { characterRepository, type ScopeClassRow } from '../repositories/character-repository.js';
import { partyRepository } from '../repositories/party-repository.js';
import { byLineage, canOffer } from './class-offer.js';
import { fail, ok, type ServiceResult } from './result.js';

/** Resolves an invite token (or none) to the classes it may roll from. A dead token is 410. */
export async function resolveClassScope(
  inviteToken: string | null | undefined,
  obrRoomId?: string | null
): Promise<ServiceResult<ClassScope>> {
  const party = inviteToken
    ? await partyRepository.findPartyForInvite(inviteToken)
    : obrRoomId
      ? await partyRepository.findPartyForObrRoom(obrRoomId)
      : null;

  if (inviteToken && !party) {
    return fail(apiError(410, 'PARTY_INVITE_INVALID', 'This invite link is no longer valid'));
  }
  if (!party) {
    const rows = await characterRepository.findBookClassRows();
    return ok({ ...rollable(rows, null), classlessEnabled: true, party: null });
  }
  const rows = await characterRepository.findClassRowsByLineage(party.poolLineageIds);
  return ok({
    ...rollable(rows, party.ownerUserId),
    classlessEnabled: party.classlessEnabled,
    party: { id: party.id, ownerUserId: party.ownerUserId },
  });
}

/**
 * Lineages whose latest version the party can offer. New rolls get that latest version;
 * a draft may still confirm on any of the lineage's versions not taken down.
 */
function rollable(
  rows: ScopeClassRow[],
  partyOwnerId: string | null
): Pick<ClassScope, 'classIds' | 'acceptedClassIds'> {
  const classIds: number[] = [];
  const acceptedClassIds: number[] = [];
  for (const { latest, versions } of byLineage(rows)) {
    if (!canOffer(latest, partyOwnerId)) continue;
    classIds.push(latest.id);
    acceptedClassIds.push(...versions.filter((v) => v.takenDownAt === null).map((v) => v.id));
  }
  const ascending = (a: number, b: number) => a - b;
  return { classIds: classIds.sort(ascending), acceptedClassIds: acceptedClassIds.sort(ascending) };
}
