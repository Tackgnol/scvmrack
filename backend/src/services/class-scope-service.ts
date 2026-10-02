import { apiError } from '../errors.js';
import type { ClassScope } from './class-choice.js';

import { characterRepository, type ScopeClassRow } from '../repositories/character-repository.js';
import { partyRepository } from '../repositories/party-repository.js';
import { fail, ok, type ServiceResult } from './result.js';

/** Resolves an invite token (or none) to the classes it may roll from. A dead token is 410. */
export async function resolveClassScope(
  inviteToken: string | null | undefined
): Promise<ServiceResult<ClassScope>> {
  if (!inviteToken) {
    const rows = await characterRepository.findBookClassRows();
    return ok({ ...rollable(rows, null), classlessEnabled: true, party: null });
  }

  const party = await partyRepository.findPartyForInvite(inviteToken);
  if (!party) {
    return fail(apiError(410, 'PARTY_INVITE_INVALID', 'This invite link is no longer valid'));
  }
  const rows = await characterRepository.findClassRowsByLineage(party.poolLineageIds);
  return ok({
    ...rollable(rows, party.ownerUserId),
    classlessEnabled: party.classlessEnabled,
    party: { id: party.id, ownerUserId: party.ownerUserId },
  });
}

/**
 * Lineages whose latest version can be rolled: active, not taken down, and
 * built-in, public or the party owner's own. New rolls get that latest version;
 * a draft may still confirm on any of the lineage's versions not taken down.
 */
function rollable(
  rows: ScopeClassRow[],
  partyOwnerId: string | null
): Pick<ClassScope, 'classIds' | 'acceptedClassIds'> {
  const byLineage = new Map<string, ScopeClassRow[]>();
  for (const row of rows) {
    byLineage.set(row.lineageId, [...(byLineage.get(row.lineageId) ?? []), row]);
  }
  const classIds: number[] = [];
  const acceptedClassIds: number[] = [];
  for (const versions of byLineage.values()) {
    const latest = versions.reduce((a, b) => (b.version > a.version ? b : a));
    const canRoll =
      latest.status === 'active' &&
      latest.takenDownAt === null &&
      (latest.source !== 'user' || latest.visibility === 'public' || latest.ownerUserId === partyOwnerId);
    if (!canRoll) continue;
    classIds.push(latest.id);
    acceptedClassIds.push(...versions.filter((v) => v.takenDownAt === null).map((v) => v.id));
  }
  const ascending = (a: number, b: number) => a - b;
  return { classIds: classIds.sort(ascending), acceptedClassIds: acceptedClassIds.sort(ascending) };
}
