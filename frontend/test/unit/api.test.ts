import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    authKeys,
    characterKeys,
    csrfMiddleware,
    authMiddleware,
    obrCharacterAccessMiddleware,
    resetRedirectControl,
} from "@/api/index";
import {
    clearObrCharacterAccessContext,
    setObrCharacterAccessContext,
} from "@/obr/obrCharacterAccess";
import { navigateToSessionExpired } from '@/router/navigation';

// Mock navigation
vi.mock('@/router/navigation', () => ({
    navigateToSessionExpired: vi.fn(),
}));

function expectRequest(value: void | Request | Response | undefined): Request {
    expect(value).toBeInstanceOf(Request);
    return value as Request;
}

function expectResponse(value: void | Request | Response | undefined): Response {
    expect(value).toBeInstanceOf(Response);
    return value as Response;
}

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
        clearObrCharacterAccessContext();
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
            const result = expectRequest(await csrfMiddleware.onRequest!({ request, schemaPath: "" } as any));
            expect(result.headers.has("x-csrf-token")).toBe(false);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it("should fetch and add CSRF token to POST requests", async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ token: "test-token" }),
            });

            const request = new Request("http://localhost/test", { method: "POST" });
            const result = expectRequest(await csrfMiddleware.onRequest!({ request, schemaPath: "" } as any));

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

            const result = expectResponse(await csrfMiddleware.onResponse!({ request, response, schemaPath: "" } as any));

            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(result.status).toBe(200);
        });

        it("should retry a consumed POST body with a fresh CSRF token", async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ token: "old-token" }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ token: "new-token" }),
                })
                .mockResolvedValueOnce(new Response(null, { status: 200 }));

            const request = new Request("http://localhost/test", {
                body: JSON.stringify({ name: "Goblin" }),
                method: "POST",
            });
            const nextRequest = expectRequest(
                await csrfMiddleware.onRequest!({
                    request,
                    schemaPath: "",
                    id: "csrf-body-retry",
                } as any),
            );
            await nextRequest.text();

            const result = expectResponse(
                await csrfMiddleware.onResponse!({
                    request: nextRequest,
                    response: new Response(null, { status: 403 }),
                    schemaPath: "",
                    id: "csrf-body-retry",
                } as any),
            );

            const retryRequest = (global.fetch as any).mock.calls.at(-1)?.[0] as Request;
            expect(result.status).toBe(200);
            expect(retryRequest.headers.get("x-csrf-token")).toBe("new-token");
            expect(retryRequest.credentials).toBe("include");
            await expect(retryRequest.clone().json()).resolves.toEqual({
                name: "Goblin",
            });
        });

        it("should return original response if CSRF token fetch fails on 403 retry", async () => {
            const request = new Request("http://localhost/test", { method: "POST" });
            const response = new Response(null, { status: 403 });

            (global.fetch as any).mockResolvedValueOnce({ ok: false });

            const result = expectResponse(await csrfMiddleware.onResponse!({ request, response, schemaPath: "" } as any));

            expect(result.status).toBe(403);
        });
    });

    describe("authMiddleware", () => {
        it("should add credentials: include to all requests", async () => {
            const request = new Request("http://localhost/test");
            const result = expectRequest(await authMiddleware.onRequest!({ request, schemaPath: "" } as any));
            expect(result.credentials).toBe("include");
        });

        it("should retry 401 once for non-auth paths", async () => {
            const request = new Request("http://localhost/test");
            const response = new Response(null, { status: 401 });

            (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 200 }));

            const promise = authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
            
            await vi.runAllTimersAsync();

            const result = expectResponse(await promise);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result.status).toBe(200);
        });

        it("should retry a consumed POST body once for non-auth paths", async () => {
            const request = new Request("http://localhost/test", {
                body: JSON.stringify({ currentHealth: 3 }),
                method: "POST",
            });
            const authedRequest = expectRequest(
                await authMiddleware.onRequest!({
                    request,
                    schemaPath: "",
                    id: "auth-body-retry",
                } as any),
            );
            await authedRequest.text();
            const response = new Response(null, { status: 401 });

            (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 200 }));

            const promise = authMiddleware.onResponse!({
                request: authedRequest,
                response,
                schemaPath: "",
                id: "auth-body-retry",
            } as any);

            await vi.runAllTimersAsync();

            const result = expectResponse(await promise);
            const retryRequest = (global.fetch as any).mock.calls[0][0] as Request;
            expect(result.status).toBe(200);
            expect(retryRequest.credentials).toBe("include");
            await expect(retryRequest.clone().json()).resolves.toEqual({
                currentHealth: 3,
            });
        });

        it("should redirect to session expired on second 401", async () => {
            const request = new Request("http://localhost/test");
            const response = new Response(null, { status: 401 });

            // Mock retry which also returns 401
            (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 401 }));

            const promise = authMiddleware.onResponse!({ request, response, schemaPath: "" } as any);
            await vi.runAllTimersAsync();
            const result = expectResponse(await promise);

            expect(result.status).toBe(401);

            // Fast forward for the 100ms redirect timeout in redirectToSessionExpired
            await vi.runAllTimersAsync();

            expect(navigateToSessionExpired).toHaveBeenCalled();
        });

        it("should ignore 401 for auth paths", async () => {
            const request = new Request("http://localhost/api/auth/login");
            const response = new Response(null, { status: 401 });

            const result = expectResponse(await authMiddleware.onResponse!({ request, response, schemaPath: "" } as any));
            
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
             const result2 = expectResponse(await authMiddleware.onResponse!({ request, response, schemaPath: "" } as any));
             
             expect(result2.status).toBe(401);
             
             await vi.runAllTimersAsync();
             const result1 = expectResponse(await promise1);
             expect(result1.status).toBe(401);
             
             // redirectToSessionExpired uses 100ms timeout
             await vi.runAllTimersAsync();
             expect(navigateToSessionExpired).toHaveBeenCalled();
        });
    });

    describe("obrCharacterAccessMiddleware", () => {
        it("adds OBR room and player headers to character detail reads", async () => {
            setObrCharacterAccessContext({
                roomId: "room-1",
                playerId: "player-1",
                connectionId: "conn-1",
            });

            const request = new Request(
                "http://localhost/api/characters/11111111-1111-4111-8111-111111111111?locale=en",
                { method: "GET" },
            );
            const result = expectRequest(
                await obrCharacterAccessMiddleware.onRequest!({
                    request,
                    schemaPath: "",
                } as any),
            );

            expect(result.headers.get("x-obr-room-id")).toBe("room-1");
            expect(result.headers.get("x-obr-player-id")).toBe("player-1");
            expect(result.headers.get("x-obr-connection-id")).toBe("conn-1");
        });

        it("does not add OBR headers to character creates", async () => {
            setObrCharacterAccessContext({
                roomId: "room-1",
                playerId: "player-1",
            });

            const request = new Request("http://localhost/api/characters/new", {
                method: "POST",
            });
            const result = expectRequest(
                await obrCharacterAccessMiddleware.onRequest!({
                    request,
                    schemaPath: "",
                } as any),
            );

            expect(result.headers.has("x-obr-room-id")).toBe(false);
            expect(result.headers.has("x-obr-player-id")).toBe(false);
        });
    });
});
