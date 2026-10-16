import type { Roller } from '@tackgnol/rpg-tools-roller';
import { apiError, type ApiHttpError } from '../errors.js';
import { classNotAvailable } from '../lib/class-model.js';
import type { PartyClassPool } from './party-class-pool-service.js';
import { fail, ok, type ServiceResult } from './result.js';

/** Why a class choice can't be rolled from the pool, or null when it can. */
export function classChoiceError(
  pool: PartyClassPool,
  classless: boolean,
  classId: number | null
): ApiHttpError | null {
  if (classless) {
    return pool.classlessEnabled
      ? null
      : apiError(409, 'CLASSLESS_NOT_AVAILABLE', 'Classless scvm are switched off for this party');
  }
  if (classId !== null && !pool.acceptedClassIds.includes(classId)) {
    return classNotAvailable('This class is no longer available here');
  }
  return null;
}

/** A random class from those the pool offers to new rolls. */
export async function pickPoolClass(pool: PartyClassPool, roller: Roller): Promise<ServiceResult<number>> {
  if (pool.classIds.length === 0) {
    return fail(classNotAvailable('No classes are available here'));
  }
  return ok(pool.classIds[(await roller.roll(`1d${pool.classIds.length}`)).total - 1]);
}
