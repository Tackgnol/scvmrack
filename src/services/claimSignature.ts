import { createHmac, timingSafeEqual } from 'node:crypto';

export const CLAIM_CHARACTER_QUERY_PARAM = 'claim-character';
export const CLAIM_SOURCE_QUERY_PARAM = 'claim-source';
export const CLAIM_USER_QUERY_PARAM = 'claim-user';
export const CLAIM_SIG_QUERY_PARAM = 'claim-sig';

function getClaimHmacSecret(): string {
    const secret = process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET or BETTER_AUTH_SECRET must be set');
    }
    return secret;
}

const buildPayload = (userId: string, sourceUserId: string, characterId: string): string =>
    `${userId}:${sourceUserId}:${characterId}`;

export function buildClaimSignature(
    userId: string,
    sourceUserId: string,
    characterId: string
): string | null {
    return createHmac('sha256', getClaimHmacSecret())
        .update(buildPayload(userId, sourceUserId, characterId))
        .digest('hex');
}

export function verifyClaimSignature(
    userId: string,
    sourceUserId: string,
    characterId: string,
    signature: string
): boolean {
    if (!signature) {
        return false;
    }

    const expected = buildClaimSignature(userId, sourceUserId, characterId);
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
