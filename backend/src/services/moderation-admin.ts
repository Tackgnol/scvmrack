import { apiError, notFound } from '../errors.js';
import { fail } from './result.js';
import { isGm, sessionUserId, type AppSession } from './session.js';

/** Returns whether a signed-in account appears in the deployment allowlist. */
export function isModerationAdmin(session: AppSession): boolean {
  const userId = sessionUserId(session);
  if (!isGm(session) || !userId) {
    return false;
  }
  return (
    process.env.MODERATION_ADMIN_USER_IDS?.split(',').some(
      (id) => id.trim() === userId
    ) ?? false
  );
}

/** The acting moderator's account id, or null when the session isn't on the allowlist. */
export function moderatorId(session: AppSession): string | null {
  return isModerationAdmin(session) ? sessionUserId(session) : null;
}

/** Moderation routes answer 404 to everyone off the allowlist, so they can't be discovered. */
export const hiddenAdminResource = () =>
  fail(notFound('MODERATION_NOT_FOUND', 'Moderation resource not found'));

export const reasonRequired = () => apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required');
