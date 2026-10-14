import type { PoolCatalogRow } from '../repositories/class-pool-repository.js';
import { byLineage, mayOffer } from '../lib/class-model.js';
import {
  POOL_GROUPS,
  type ClassPoolView,
  type PoolAttribution,
  type PoolClass,
  type PoolGroup,
  type RemovedPoolClass,
} from '../schemas/party.js';


/**
 * The GM's view of a party's pool: every class the GM may offer (latest version,
 * grouped by where it comes from) with its switch state, and the pooled classes
 * that are gone since, as notices.
 */
export function buildClassPoolView(input: {
  rows: PoolCatalogRow[];
  poolLineageIds: string[];
  classlessEnabled: boolean;
  partyOwnerId: string;
  memberClassIds: Array<number | null>;
}): ClassPoolView {
  const pooled = new Set(input.poolLineageIds);
  const lineageOf = new Map(input.rows.map((row) => [row.id, row.lineageId]));
  const playing = new Map<string, number>();
  for (const classId of input.memberClassIds) {
    const lineage = classId === null ? undefined : lineageOf.get(classId);
    if (lineage) {
      playing.set(lineage, (playing.get(lineage) ?? 0) + 1);
    }
  }

  const classes: PoolClass[] = [];
  const removed: RemovedPoolClass[] = [];
  for (const { latest: row } of byLineage(input.rows)) {
    if (mayOffer(row, input.partyOwnerId)) {
      const group = poolGroup(row, input.partyOwnerId);
      classes.push({
        lineageId: row.lineageId,
        classId: row.id,
        group,
        name: row.name,
        blurb: row.blurb,
        languages: row.languages,
        attribution: attribution(row),
        abilityCount: row.abilityCount,
        randomAbilityCount: row.randomAbilityCount,
        classItemCount: row.classItemCount,
        gettingBetterRule: row.gettingBetterRule,
        version: row.version,
        playingHere: playing.get(row.lineageId) ?? 0,
        enabled: pooled.has(row.lineageId),
      });
    } else if (pooled.has(row.lineageId)) {
      removed.push(removedNotice(row));
    }
  }

  classes.sort(
    (a, b) => POOL_GROUPS.indexOf(a.group) - POOL_GROUPS.indexOf(b.group) || a.classId - b.classId
  );
  return { classlessEnabled: input.classlessEnabled, classes, removed };
}

/** Where an offerable class shows in the panel. */
function poolGroup(row: PoolCatalogRow, partyOwnerId: string): PoolGroup {
  switch (row.source) {
    case 'main_book':
      return 'book';
    case 'zine':
      return 'zine';
    case 'the_rack':
      return 'rack';
    case 'user':
      return row.ownerUserId === partyOwnerId ? 'mine' : 'public';
  }
}

function attribution(row: PoolCatalogRow): PoolAttribution | null {
  if (row.credit) {
    return { kind: 'credit', ...row.credit };
  }
  if (row.source !== 'user') {
    return null;
  }
  return { kind: 'owner', name: row.ownerName, private: row.visibility === 'private' };
}

function removedNotice(row: PoolCatalogRow): RemovedPoolClass {
  const base = { lineageId: row.lineageId, name: row.name };
  if (row.takenDownAt !== null) {
    return { ...base, by: null, reason: 'taken_down' };
  }
  if (row.status === 'archived') {
    return { ...base, by: row.ownerName, reason: 'archived' };
  }
  return { ...base, by: row.ownerName, reason: 'unpublished' };
}
