import createClient, { type Middleware } from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import { navigateToSessionExpired } from '@/router/navigation';
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

/** @internal */
export function resetRedirectControl() {
    isRedirecting = false;
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
let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
    const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || ""}/api/csrf-token`,
        { credentials: "include" }
    );
    if (!res.ok) {
        throw new Error("Failed to fetch CSRF token");
    }
    const data = (await res.json()) as { token: string };
    csrfToken = data.token;
    return csrfToken;
}

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export const csrfMiddleware: Middleware = {
    async onRequest({ request }) {
        if (!MUTATING_METHODS.includes(request.method)) {
            return request;
        }

        if (!csrfToken) {
            await fetchCsrfToken();
        }

        const headers = new Headers(request.headers);
        headers.set("x-csrf-token", csrfToken!);
        return new Request(request, { headers });
    },

    async onResponse({ request, response }) {
        // If we get a 403 on a mutating request, the token may have expired.
        // Fetch a fresh token and retry once.
        if (response.status === 403 && MUTATING_METHODS.includes(request.method)) {
            try {
                await fetchCsrfToken();
            } catch {
                return response;
            }

            const headers = new Headers(request.headers);
            headers.set("x-csrf-token", csrfToken!);
            return fetch(new Request(request, { headers, credentials: "include" }));
        }
        return response;
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

// Track retry state
const pendingRetries = new Set<string>();

export const authMiddleware: Middleware = {
    async onRequest({ request }) {
        return new Request(request, {
            credentials: "include",
        });
    },

    async onResponse({ request, response }) {
        if (response.status !== 401) {
            return response;
        }

        const url = new URL(request.url);

        // Don't handle 401 for auth endpoints (expected for login failures)
        if (isAuthPath(url.pathname)) {
            return response;
        }

        const requestKey = `${request.method}:${url.pathname}`;

        // Already retried? Redirect to session-expired flow
        if (pendingRetries.has(requestKey)) {
            pendingRetries.delete(requestKey);
            redirectToSessionExpired();
            return response;
        }

        // First 401 - retry once
        pendingRetries.add(requestKey);
        await new Promise((resolve) => setTimeout(resolve, 500));

        const retryResponse = await fetch(
            new Request(request, { credentials: "include" })
        );

        pendingRetries.delete(requestKey);

        if (retryResponse.status === 401) {
            redirectToSessionExpired();
        }

        return retryResponse;
    },
};

// ============================================
// Create Clients
// ============================================
const client = createClient<paths>({
    baseUrl: import.meta.env.VITE_BACKEND_URL || "",
});

client.use(csrfMiddleware);
client.use(authMiddleware);

export const $api = createQueryClient(client);
export { client,paths };
