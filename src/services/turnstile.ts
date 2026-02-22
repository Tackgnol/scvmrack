const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

export function isTurnstileEnabled(): boolean {
    return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(
    token: string,
    remoteIp?: string
): Promise<{ success: boolean; errorCodes: string[] }> {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
        return { success: false, errorCodes: ['missing-input-secret'] };
    }

    const payload = new URLSearchParams({
        secret,
        response: token,
    });

    if (remoteIp) {
        payload.set('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload,
    });

    if (!response.ok) {
        return { success: false, errorCodes: [`http_${response.status}`] };
    }

    const data = (await response.json()) as TurnstileVerifyResponse;

    return {
        success: data.success,
        errorCodes: Array.isArray(data['error-codes']) ? data['error-codes'] : [],
    };
}
