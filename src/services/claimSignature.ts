import { createHmac, timingSafeEqual } from 'node:crypto';

export const CLAIM_CHARACTER_QUERY_PARAM = 'claim-character';
export const CLAIM_SOURCE_QUERY_PARAM = 'claim-source';
export const CLAIM_USER_QUERY_PARAM = 'claim-user';
export const CLAIM_SIG_QUERY_PARAM = 'claim-sig';
export const CLAIM_TS_QUERY_PARAM = 'claim-ts';

const DEFAULT_CLAIM_SIGNATURE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function getClaimHmacSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET or BETTER_AUTH_SECRET must be set');
  }
  return secret;
}

function getClaimSignatureTtlMs(): number {
  const raw = process.env.CLAIM_SIGNATURE_TTL_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CLAIM_SIGNATURE_TTL_MS;
  }

  return parsed;
}

const buildPayload = (
  userId: string,
  sourceUserId: string,
  characterId: string,
  issuedAt: number
): string => `${userId}:${sourceUserId}:${characterId}:${issuedAt}`;

export function buildClaimSignature(
  userId: string,
  sourceUserId: string,
  characterId: string,
  issuedAt = Date.now()
): string | null {
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    return null;
  }

  return createHmac('sha256', getClaimHmacSecret())
    .update(buildPayload(userId, sourceUserId, characterId, issuedAt))
    .digest('hex');
}

export function verifyClaimSignature(
  userId: string,
  sourceUserId: string,
  characterId: string,
  signature: string,
  issuedAt: number
): boolean {
  if (!signature) {
    return false;
  }

  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    return false;
  }

  const now = Date.now();
  const maxAge = getClaimSignatureTtlMs();
  if (issuedAt > now + MAX_CLOCK_SKEW_MS || now - issuedAt > maxAge) {
    return false;
  }

  const expected = buildClaimSignature(userId, sourceUserId, characterId, issuedAt);
  if (!expected) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
