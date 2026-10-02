import { apiError, type ApiHttpError } from '../errors.js';

/** The classes a roll or forge may use: a party's pool through its invite, Book Classes otherwise. */
export type ClassScope = {
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

/** Why a class choice can't be rolled in this scope, or null when it can. */
export function classChoiceError(
  scope: ClassScope,
  classless: boolean,
  classId: number | null
): ApiHttpError | null {
  if (classless) {
    return scope.classlessEnabled
      ? null
      : apiError(409, 'CLASSLESS_NOT_AVAILABLE', 'Classless scvm are switched off for this party');
  }
  if (classId !== null && !scope.acceptedClassIds.includes(classId)) {
    return apiError(409, 'CLASS_NOT_AVAILABLE', 'This class is no longer available here');
  }
  return null;
}
