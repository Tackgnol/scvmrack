import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authKeys, characterKeys, csrfMiddleware, authMiddleware, resetRedirectControl } from "@/api/index";
import { navigateToSessionExpired } from '@/router/navigation';

// Mock navigation
vi.mock('@/router/navigation', () => ({
    navigateToSessionExpired: vi.fn(),
}));

describe("API Index", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Reset global fetch mock
        global.fetch = vi.fn();
        resetRedirectControl();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Query Keys", () => {
        it("should have correct authKeys", () => {
            expect(authKeys.all).toEqual(["auth"]);
            expect(authKeys.session()).toEqual(["auth", "session"]);
            expect(authKeys.me()).toEqual(["auth", "me"]);
        });

        it("should have correct characterKeys", () => {
            expect(characterKeys.all).toEqual(["characters"]);
            expect(characterKeys.list()).toEqual(["characters", "list"]);
            expect(characterKeys.detail("123")).toEqual(["characters", "123", undefined]);
            expect(characterKeys.detail("123", "en")).toEqual(["characters", "123", "en"]);
        });
    });

    describe("csrfMiddleware", () => {
        it("should not add CSRF token to GET requests", async () => {
            const request = new Request("http://localhost/test", { method: "GET" });
            const result = await csrfMiddleware.onRequest!({ request, schemaPath: "" } as any);
            expect(result.headers.has("x-csrf-token")).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it("should fetch and add CSRF token to POST requests", async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ token: "test-token" }),
            });

            const request = new Request("http://localhost/test", { method: "POST" });
            const result = await csrfMiddleware.onRequest!({ request, schemaPath: "" } as any);

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/csrf-token"), expect.any(Object));
            expect(result.headers.get("x-csrf-token")).toBe("test-token");
        });

        it("should retry with new CSRF token on 403 response", async () => {
            const request = new Request("http://localhost/test", { method: "POST" });
            const response = new Response(null, { status: 403 });

            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ token: "new-token" }),
                })
                .mockResolvedValueOnce(new Response(null, { status: 200 }));

            const result = await csrfMiddleware.onResponse!({ request, response, schemaPath: "" } as any);

            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(result.status).toBe(200);
        });

        it("should return original response if CSRF token fetch fails on 403 retry", async () => {
            const request = new Request("http://localhost/test", { method: "POST" });
            const response = new Response(null, { status: 403 });

            (global.fetch as any).mockResolvedValueOnce({ ok: false });

            const result = await csrfMiddleware.onResponse!({ request, response, schemaPath: "" } as any);

            expect(result.status).toBe(403);
        });
    });

    describe("authMiddleware", () => {
        it("should add credentials: include to all requests", async () => {
            const request = new Request("http://localhost/test");
            const result = await authMiddleware.onRequest!({ request, schemaPath: "" } as any);
            expect(result.credentials).toBe("include");
        });

        it("should retry 401 once for non-auth paths", async () => {
            const request = new Request("http://localhost/test");
            const response = new Response(null, { status: 401 });

            (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 200 }));

            const promise = authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
            
            await vi.runAllTimersAsync();

            const result = await promise;
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result.status).toBe(200);
        });

        it("should redirect to session expired on second 401", async () => {
            const request = new Request("http://localhost/test");
            const response = new Response(null, { status: 401 });

            // Mock retry which also returns 401
            (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 401 }));

            const promise = authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
            await vi.runAllTimersAsync();
            const result = await promise;

            expect(result.status).toBe(401);

            // Fast forward for the 100ms redirect timeout in redirectToSessionExpired
            await vi.runAllTimersAsync();

            expect(navigateToSessionExpired).toHaveBeenCalled();
        });

        it("should ignore 401 for auth paths", async () => {
            const request = new Request("http://localhost/api/auth/login");
            const response = new Response(null, { status: 401 });

            const result = await authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
            
            expect(global.fetch).not.toHaveBeenCalled();
            expect(result.status).toBe(401);
        });

        it("should handle parallel 401s by redirecting if already retrying", async () => {
             const request = new Request("http://localhost/parallel-test");
             const response = new Response(null, { status: 401 });
             
             (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 401 }));
             const promise1 = authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
             
             // The first call is now in the middle of the 500ms timeout
             // Second call for same request while first is pending
             const result2 = await authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
             
             expect(result2.status).toBe(401);
             
             await vi.runAllTimersAsync();
             const result1 = await promise1;
             expect(result1.status).toBe(401);
             
             // redirectToSessionExpired uses 100ms timeout
             await vi.runAllTimersAsync();
             expect(navigateToSessionExpired).toHaveBeenCalled();
        });
    });
});
