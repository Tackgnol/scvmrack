import { apiError, badRequest, notFound, unauthorized, type ApiHttpError } from '../errors.js';
import { byLineage, classNotAvailable, mayOffer, type ClassVersionRef } from '../lib/class-model.js';
import { translatedClassTexts } from '../lib/class-translations.js';
import { isValidUUID } from '../utils.js';
import { classPoolRepository, type PartyPoolRow } from '../repositories/class-pool-repository.js';
import type { ClassPoolView } from '../schemas/party.js';
import { buildClassPoolView } from './class-pool-view.js';
import { fail, ok, unexpected, type ServiceLogger, type ServiceResult } from './result.js';
import { sessionUserId, type AppSession } from './session.js';

/**
 * What a table may roll, handed to character creation: a party's Party Class Pool, or the Book
 * Classes outside a party. Creation decides whether a given choice is allowed and picks from it.
 */
export type PartyClassPool = {
  /** What new rolls and the class screen offer: the latest rollable version of each lineage. */
  classIds: number[];
  /**
   * What a draft may still be confirmed on: any version of a still-rollable lineage
   * that isn't taken down, so a GM saving a new version doesn't undo a landed roll.
   */
  acceptedClassIds: number[];
  classlessEnabled: boolean;
  party: { id: string; ownerUserId: string } | null;
};

/** Resolves an invite token, an Owlbear room, or neither to the pool a roll may use. A dead token is 410. */
export async function resolvePartyClassPool(
  inviteToken: string | null | undefined,
  obrRoomId?: string | null
): Promise<ServiceResult<PartyClassPool>> {
  const party = inviteToken
    ? await classPoolRepository.findPool({ inviteToken })
    : obrRoomId
      ? await classPoolRepository.findPool({ obrRoomId })
      : null;

  if (inviteToken && !party) {
    return fail(apiError(410, 'PARTY_INVITE_INVALID', 'This invite link is no longer valid'));
  }
  if (!party) {
    const rows = await classPoolRepository.findBookClassRows();
    return ok({ ...rollable(rows, null), classlessEnabled: true, party: null });
  }
  const rows = await classPoolRepository.findClassRowsByLineage(party.poolLineageIds);
  return ok({
    ...rollable(rows, party.ownerUserId),
    classlessEnabled: party.classlessEnabled,
    party: { id: party.id, ownerUserId: party.ownerUserId },
  });
}

/** The lineages a new party's pool starts with: every Book Class. */
export function defaultPoolLineageIds(): Promise<string[]> {
  return classPoolRepository.findBookLineageIds();
}

/**
 * Lineages whose latest version the party can offer. New rolls get that latest version;
 * a draft may still confirm on any of the lineage's versions not taken down.
 */
function rollable(
  rows: ClassVersionRef[],
  partyOwnerId: string | null
): Pick<PartyClassPool, 'classIds' | 'acceptedClassIds'> {
  const classIds: number[] = [];
  const acceptedClassIds: number[] = [];
  for (const { latest, versions } of byLineage(rows)) {
    if (!mayOffer(latest, partyOwnerId)) {
      continue;
    }
    classIds.push(latest.id);
    acceptedClassIds.push(...versions.filter((v) => v.takenDownAt === null).map((v) => v.id));
  }
  const ascending = (a: number, b: number) => a - b;
  return { classIds: classIds.sort(ascending), acceptedClassIds: acceptedClassIds.sort(ascending) };
}

/** The GM's Party Class Pool panel: viewing the pool and switching classes or classless scvm on and off. */
export function createPartyClassPoolService(log: ServiceLogger) {
  /** The pool of a party the session owns, or why it can't be had. */
  async function ownedPool(session: AppSession, id: string): Promise<ServiceResult<PartyPoolRow>> {
    if (!isValidUUID(id)) {
      return fail(badRequest('INVALID_PARTY_ID', 'Invalid party ID'));
    }
    const userId = sessionUserId(session);
    if (!userId) {
      return fail(unauthorized());
    }
    const pool = await classPoolRepository.findPool({ id });
    if (!pool || pool.ownerUserId !== userId) {
      return fail(notFound('PARTY_NOT_FOUND', 'Party not found'));
    }
    return ok(pool);
  }

  async function view(pool: PartyPoolRow, locale: string): Promise<ClassPoolView> {
    const sources = await classPoolRepository.findCatalogRows(pool.ownerUserId, pool.poolLineageIds);
    const texts = await translatedClassTexts(locale, sources);
    const rows = sources.map(({ nameKey: _nameKey, descriptionKey: _descriptionKey, appendix, ...row }, i) => ({
      ...row,
      name: texts[i].name,
      blurb: texts[i].description ?? appendix,
    }));
    return buildClassPoolView({
      rows,
      poolLineageIds: pool.poolLineageIds,
      classlessEnabled: pool.classlessEnabled,
      partyOwnerId: pool.ownerUserId,
      memberClassIds: pool.memberClassIds,
    });
  }

  /** Runs `change` on a party the session owns, then returns the pool as it now stands. */
  async function changePool(
    input: { session: AppSession; id: string; locale: string },
    change: (pool: PartyPoolRow) => Promise<ApiHttpError | void>
  ): Promise<ServiceResult<ClassPoolView>> {
    try {
      const owned = await ownedPool(input.session, input.id);
      if (!owned.ok) {
        return owned;
      }
      const refused = await change(owned.value);
      if (refused) {
        return fail(refused);
      }
      const current = await classPoolRepository.findPool({ id: input.id });
      if (!current) {
        return fail(notFound('PARTY_NOT_FOUND', 'Party not found'));
      }
      return ok(await view(current, input.locale));
    } catch (err) {
      return fail(unexpected(log, err, 'CLASS_POOL_UPDATE_FAILED', 'Failed to update the class pool'));
    }
  }

  return {
    async getClassPool(input: { session: AppSession; id: string; locale: string }): Promise<ServiceResult<ClassPoolView>> {
      try {
        const owned = await ownedPool(input.session, input.id);
        return owned.ok ? ok(await view(owned.value, input.locale)) : owned;
      } catch (err) {
        return fail(unexpected(log, err, 'CLASS_POOL_LOAD_FAILED', 'Failed to load the class pool'));
      }
    },

    /** Switches one class lineage; only a class the GM may offer can be switched on. */
    setPoolClass(input: { session: AppSession; id: string; lineageId: string; enabled: boolean; locale: string }) {
      return changePool(input, async (pool) => {
        if (input.enabled) {
          const rows = await classPoolRepository.findCatalogRows(pool.ownerUserId, pool.poolLineageIds);
          const offerable = byLineage(rows).some(
            ({ latest }) => latest.lineageId === input.lineageId && mayOffer(latest, pool.ownerUserId)
          );
          if (!offerable) {
            return classNotAvailable('This class cannot be added to the pool');
          }
        }
        await classPoolRepository.setLineage(input.id, input.lineageId, input.enabled);
      });
    },

    setPoolClassless(input: { session: AppSession; id: string; enabled: boolean; locale: string }) {
      return changePool(input, async () => {
        await classPoolRepository.setClassless(input.id, input.enabled);
      });
    },
  };
}
