import { createHmac, timingSafeEqual } from 'node:crypto';

export const CLAIM_CHARACTER_QUERY_PARAM = 'claim-character';
export const CLAIM_SESSION_QUERY_PARAM = 'claim-session';
export const CLAIM_USER_QUERY_PARAM = 'claim-user';
export const CLAIM_SIG_QUERY_PARAM = 'claim-sig';

const CLAIM_HMAC_SECRET = process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || '';

const buildPayload = (userId: string, guestSessionId: string, characterId: string): string =>
    `${userId}:${guestSessionId}:${characterId}`;

export function buildClaimSignature(
    userId: string,
    guestSessionId: string,
    characterId: string
): string | null {
    if (!CLAIM_HMAC_SECRET) {
        return null;
    }

    return createHmac('sha256', CLAIM_HMAC_SECRET)
        .update(buildPayload(userId, guestSessionId, characterId))
        .digest('hex');
}

export function verifyClaimSignature(
    userId: string,
    guestSessionId: string,
    characterId: string,
    signature: string
): boolean {
    if (!CLAIM_HMAC_SECRET || !signature) {
        return false;
    }

    const expected = buildClaimSignature(userId, guestSessionId, characterId);
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
