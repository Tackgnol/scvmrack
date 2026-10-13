import { isAvailable, mayUse, type ClassVersionRef } from '../lib/class-model.js';

/** Every version of each lineage, with its latest one. */
export function byLineage<T extends Pick<ClassVersionRef, 'lineageId' | 'version'>>(
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

/** Whether a party may offer a class version: available, and usable by the party's owner. */
export function canOffer(row: ClassVersionRef, partyOwnerId: string | null): boolean {
  return isAvailable(row) && mayUse(row, partyOwnerId);
}
