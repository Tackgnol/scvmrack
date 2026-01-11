import createClient, { type Middleware } from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { paths } from "./schema.ts";
// ============================================
// Auth Query Keys
// ============================================
export const authKeys = {
    all: ["auth"] as const,
    session: () => [...authKeys.all, "session"] as const,
    sessionInfo: () => [...authKeys.all, "session-info"] as const,
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

function redirectToLogin() {
    if (isRedirecting) return;
    isRedirecting = true;

    setTimeout(() => {
        window.location.href = "/login?expired=true";
    }, 100);
}

// ============================================
// Auth Middleware
// ============================================

/** Paths that don't trigger redirect on 401 */
const AUTH_PATHS = ["/auth/"];

function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some((prefix) => pathname.startsWith(prefix));
}

// Track retry state
const pendingRetries = new Set<string>();

const authMiddleware: Middleware = {
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

        // Already retried? Redirect to login
        if (pendingRetries.has(requestKey)) {
            pendingRetries.delete(requestKey);
            redirectToLogin();
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
            redirectToLogin();
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

client.use(authMiddleware);

export const $api = createQueryClient(client);
export { client,paths };
