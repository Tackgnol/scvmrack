import createClient, { type Middleware } from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import { navigateToSessionExpired } from '@/router/navigation';
import {
    clearObrCharacterAccessContext,
    obrCharacterAccessHeaders,
} from '@/obr/obrCharacterAccess';
import { embeddedSessionHeaders } from '@/utils/embed';
import type { paths } from "./schema.ts";
// ============================================
// Auth Query Keys
// ============================================
export const authKeys = {
    all: ["auth"] as const,
    session: () => [...authKeys.all, "session"] as const,
    me: () => [...authKeys.all, "me"] as const,
};


// ============================================
// Character Query Keys
// ============================================
export const characterKeys = {
    all: ["characters"] as const,
    list: () => [...characterKeys.all, "list"] as const,
    detail: (id: string, locale?: string) => [...characterKeys.all, id, locale] as const,
};

// ============================================
// Redirect Control
// ============================================
let isRedirecting = false;
let csrfToken: string | null = null;
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const csrfRetryRequests = new Map<string, Request>();
const authRetryRequests = new Map<string, Request>();
const pendingRetries = new Set<string>();

/** @internal */
export function resetRedirectControl() {
    isRedirecting = false;
    csrfToken = null;
    csrfRetryRequests.clear();
    authRetryRequests.clear();
    pendingRetries.clear();
    clearObrCharacterAccessContext();
}

function redirectToSessionExpired() {
    if (isRedirecting) return;
    isRedirecting = true;

    setTimeout(() => {
        void navigateToSessionExpired();
    }, 100);
}

// ============================================
// CSRF Token Management
// ============================================
async function fetchCsrfToken(): Promise<string> {
    const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || ""}/api/csrf-token`,
        { credentials: "include", headers: embeddedSessionHeaders() }
    );
    if (!res.ok) {
        throw new Error("Failed to fetch CSRF token");
    }
    const data = (await res.json()) as { token: string };
    csrfToken = data.token;
    return csrfToken;
}

/**
 * Returns a CSRF token for callers that issue raw `fetch()` requests outside the
 * openapi-fetch client (which applies {@link csrfMiddleware} automatically) — e.g.
 * the feedback reporter. Reuses the cached token and fetches one on first use.
 */
export async function getCsrfToken(): Promise<string> {
    if (!csrfToken) {
        await fetchCsrfToken();
    }
    return csrfToken!;
}

export async function refreshCsrfToken(): Promise<string> {
    return fetchCsrfToken();
}

function rememberRetryRequest(
    store: Map<string, Request>,
    id: string | undefined,
    request: Request,
) {
    if (!id || request.body === null) {
        return;
    }

    store.set(id, request.clone());
}

export const csrfMiddleware: Middleware = {
    async onRequest({ request, id }) {
        if (!MUTATING_METHODS.includes(request.method)) {
            return request;
        }

        if (!csrfToken) {
            await fetchCsrfToken();
        }

        const headers = new Headers(request.headers);
        headers.set("x-csrf-token", csrfToken!);
        const nextRequest = new Request(request, {
            credentials: "include",
            headers,
        });
        rememberRetryRequest(csrfRetryRequests, id, nextRequest);
        return nextRequest;
    },

    async onResponse({ request, response, id }) {
        // If we get a 403 on a mutating request, the token may have expired.
        // Fetch a fresh token and retry once.
        if (response.status === 403 && MUTATING_METHODS.includes(request.method)) {
            try {
                await fetchCsrfToken();
            } catch {
                csrfRetryRequests.delete(id);
                return response;
            }

            const retryRequest = csrfRetryRequests.get(id) ?? request;
            const headers = new Headers(request.headers);
            headers.set("x-csrf-token", csrfToken!);
            csrfRetryRequests.delete(id);
            return fetch(
                new Request(retryRequest, { headers, credentials: "include" })
            );
        }
        csrfRetryRequests.delete(id);
        return response;
    },

    onError({ id }) {
        csrfRetryRequests.delete(id);
    },
};

// ============================================
// Auth Middleware
// ============================================

/** Paths that don't trigger redirect on 401 */
const AUTH_PATHS = ["/api/auth/"];

export function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export const authMiddleware: Middleware = {
    async onRequest({ request, id }) {
        if (request.credentials === "include") {
            rememberRetryRequest(authRetryRequests, id, request);
            return request;
        }

        const nextRequest = new Request(request, {
            credentials: "include",
        });
        rememberRetryRequest(authRetryRequests, id, nextRequest);
        return nextRequest;
    },

    async onResponse({ request, response, id }) {
        if (response.status !== 401) {
            authRetryRequests.delete(id);
            return response;
        }

        const url = new URL(request.url);

        // Don't handle 401 for auth endpoints (expected for login failures)
        if (isAuthPath(url.pathname)) {
            authRetryRequests.delete(id);
            return response;
        }

        const requestKey = `${request.method}:${url.pathname}`;

        // Already retried? Redirect to session-expired flow
        if (pendingRetries.has(requestKey)) {
            pendingRetries.delete(requestKey);
            authRetryRequests.delete(id);
            redirectToSessionExpired();
            return response;
        }

        // First 401 - retry once
        pendingRetries.add(requestKey);
        await new Promise((resolve) => setTimeout(resolve, 500));

        const retryRequest = authRetryRequests.get(id) ?? request;
        const retryResponse = await fetch(
            new Request(retryRequest, { credentials: "include" })
        );

        pendingRetries.delete(requestKey);
        authRetryRequests.delete(id);

        if (retryResponse.status === 401) {
            redirectToSessionExpired();
        }

        return retryResponse;
    },

    onError({ id }) {
        authRetryRequests.delete(id);
    },
};

// ============================================
// OBR Character Access Middleware
// ============================================
const CHARACTER_DETAIL_RE = /^\/api\/characters\/[0-9a-f-]+$/i;
const OBR_CHARACTER_METHODS = new Set(["GET", "PATCH"]);

export const obrCharacterAccessMiddleware: Middleware = {
    onRequest({ request }) {
        if (!OBR_CHARACTER_METHODS.has(request.method.toUpperCase())) {
            return request;
        }

        const url = new URL(request.url);
        if (!CHARACTER_DETAIL_RE.test(url.pathname)) {
            return request;
        }

        const obrHeaders = obrCharacterAccessHeaders();
        if (Object.keys(obrHeaders).length === 0) {
            return request;
        }

        const headers = new Headers(request.headers);
        for (const [key, value] of Object.entries(obrHeaders)) {
            headers.set(key, value);
        }

        return new Request(request, {
            credentials: request.credentials,
            headers,
        });
    },
};

// ============================================
// Create Clients
// ============================================
const client = createClient<paths>({
    baseUrl: import.meta.env.VITE_BACKEND_URL || "",
});

client.use(obrCharacterAccessMiddleware);
client.use(csrfMiddleware);
client.use(authMiddleware);

export const $api = createQueryClient(client);
export { client,paths };
