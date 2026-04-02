/**
 * Shared auth service mock state used by authRoutes.test.ts and sessionResolver.test.ts.
 *
 * Both test files need to mock `src/services/auth.ts`, but because Node's ESM cache is shared
 * within a single test run, the first mock.module() call wins for subsequent imports. By sharing
 * these mock functions (same object references), both test files can independently control the
 * returned session / handler response through the state objects below.
 */
import { mock } from 'node:test';

// ── Session state (used by sessionResolver plugin) ────────────────────────────

interface SessionState {
  result: unknown;
  shouldThrow: boolean;
}

const sessionState: SessionState = { result: null, shouldThrow: false };

export const mockGetSession = mock.fn(async () => {
  if (sessionState.shouldThrow) throw new Error('Auth service unavailable');
  return sessionState.result;
});

/** Set what auth.api.getSession() will return for the next test(s). */
export function setSession(result: unknown): void {
  sessionState.result = result;
  sessionState.shouldThrow = false;
}

/** Make auth.api.getSession() throw on the next call(s). */
export function setSessionError(): void {
  sessionState.shouldThrow = true;
  sessionState.result = null;
}

/** Reset to defaults: returns null, no throw. */
export function resetSession(): void {
  sessionState.result = null;
  sessionState.shouldThrow = false;
  mockGetSession.mock.resetCalls();
}

// ── Handler state (used by auth route) ────────────────────────────────────────

interface HandlerCapture {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

const handlerState: {
  capturedReq: HandlerCapture | null;
  response: Response;
} = {
  capturedReq: null,
  response: new Response('{}', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }),
};

export const mockHandler = mock.fn(async (req: Request) => {
  const ct = req.headers.get('content-type') ?? '';
  handlerState.capturedReq = {
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    body: ct.includes('json') ? await req.json() : null,
  };
  return handlerState.response.clone();
});

/** Override the Response that auth.handler() will return. */
export function setHandlerResponse(response: Response): void {
  handlerState.response = response;
}

/** Retrieve the last Request captured by auth.handler(). */
export function getCapturedRequest(): HandlerCapture | null {
  return handlerState.capturedReq;
}

/** Reset to defaults: no captured request, 200 response. */
export function resetHandler(): void {
  handlerState.capturedReq = null;
  handlerState.response = new Response('{}', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  mockHandler.mock.resetCalls();
}
