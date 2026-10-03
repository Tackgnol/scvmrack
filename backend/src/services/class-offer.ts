import type { ScopeClassRow } from '../repositories/character-repository.js';

type OfferRow = Pick<
  ScopeClassRow,
  'lineageId' | 'version' | 'source' | 'status' | 'visibility' | 'ownerUserId' | 'takenDownAt'
>;

/** Every version of each lineage, with its latest one. */
export function byLineage<T extends Pick<ScopeClassRow, 'lineageId' | 'version'>>(
  rows: T[]
): Array<{ latest: T; versions: T[] }> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    groups.set(row.lineageId, [...(groups.get(row.lineageId) ?? []), row]);
  }
  return [...groups.values()].map((versions) => ({
    latest: versions.reduce((a, b) => (b.version > a.version ? b : a)),
    versions,
  }));
}

/**
 * Whether a party may offer a class version: active, not taken down, and
 * built-in, public or the party owner's own.
 */
export function canOffer(row: OfferRow, partyOwnerId: string | null): boolean {
  return (
    row.status === 'active' &&
    row.takenDownAt === null &&
    (row.source !== 'user' || row.visibility === 'public' || row.ownerUserId === partyOwnerId)
  );
}
