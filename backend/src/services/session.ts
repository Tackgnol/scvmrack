/**
 * Raw shared-auth session shape the service layer reasons about. A GM is an
 * authenticated, non-anonymous account; a character owner is matched on the
 * account id (`user.id`) OR the anonymous session id (`session.id`). Decoupled
 * from Fastify so services can be unit-tested with a plain object.
 */
export type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

export function sessionUserId(session: AppSession): string | null {
  return session?.user?.id ?? null;
}

export function sessionId(session: AppSession): string | null {
  return session?.session?.id ?? null;
}

/** A GM is a present, non-anonymous account. */
export function isGm(session: AppSession): boolean {
  return Boolean(sessionUserId(session)) && session?.user?.isAnonymous !== true;
}

/** Any session (account or anonymous) that may write OBR room bindings. */
export function hasObrWriteSession(session: AppSession): boolean {
  return Boolean(sessionUserId(session) || sessionId(session));
}

/**
 * A caller owns a character when the account id matches `userId` (account) OR
 * the anonymous session id matches `sessionId` (guest). Mirrors the app's
 * ownership-by-binding model.
 */
export function ownsCharacter(
  session: AppSession,
  character: { userId: string | null; sessionId: string | null }
): boolean {
  const userId = sessionUserId(session);
  if (userId && character.userId === userId) {
    return true;
  }
  const sid = sessionId(session);
  if (sid && character.sessionId === sid) {
    return true;
  }
  return false;
}
