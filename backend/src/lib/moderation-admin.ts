import { isGm, sessionUserId, type AppSession } from '../services/session.js';

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
