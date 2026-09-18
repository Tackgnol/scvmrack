import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/react';
import {
  bootstrapAnonymousSession,
  fetchSession,
  loginUrl,
  profileUrl,
  signInAnonymous,
  signOut,
} from '@/auth';

vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }));

const mockFetch = vi.fn();

describe('auth api helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_BACKEND_URL', 'https://api.example.test');
    vi.stubEnv('VITE_LOGTO_ENDPOINT', 'https://auth.example.test///');
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns null for unauthenticated session responses', async () => {
    mockFetch.mockResolvedValueOnce({ status: 401 });
    await expect(fetchSession()).resolves.toBeNull();

    mockFetch.mockResolvedValueOnce({ status: 204 });
    await expect(fetchSession()).resolves.toBeNull();
  });

  it('returns null when the session payload has no user', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ session: { id: 'session-1' } }),
    });

    await expect(fetchSession()).resolves.toBeNull();
  });

  it('returns the authenticated session payload', async () => {
    const session = {
      session: { id: 'session-1' },
      user: { id: 'user-1', isAnonymous: false },
    };
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => session,
    });

    await expect(fetchSession()).resolves.toEqual(session);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/get-session',
      { credentials: 'include', cache: 'no-store', headers: {} }
    );
  });

  it('throws when fetching the session fails', async () => {
    mockFetch.mockResolvedValueOnce({ status: 500, ok: false });

    await expect(fetchSession()).rejects.toThrow('Failed to fetch auth session');
  });

  it('bootstraps anonymous sessions with credentials', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await expect(signInAnonymous()).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/sign-in/anonymous',
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }
    );
  });

  it('throws when anonymous bootstrap fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(signInAnonymous()).rejects.toThrow(
      'Failed to bootstrap anonymous session'
    );
  });

  it('signs out with credentials', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await expect(signOut()).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/sign-out',
      { method: 'POST', credentials: 'include', headers: {} }
    );
  });

  it('throws when sign out fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(signOut()).rejects.toThrow('Failed to sign out');
  });

  it('builds auth URLs from environment values', () => {
    expect(loginUrl()).toBe(
      'https://api.example.test/api/auth/oauth2/login/logto'
    );
    expect(profileUrl()).toBe('https://auth.example.test/account/security');
  });

  it('uses relative login and default Logto profile URLs without env values', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_BACKEND_URL', '');

    expect(loginUrl()).toBe('/api/auth/oauth2/login/logto');
    expect(profileUrl()).toBe('https://auth.rpgtools.co/account/security');
  });

  describe('bootstrapAnonymousSession', () => {
    const user = { session: { id: 's' }, user: { id: 'u', isAnonymous: true } };
    const sessionResponse = (body: unknown) => ({
      status: 200,
      ok: true,
      json: async () => body,
    });
    const signInResponse = (status: number) => ({ ok: status < 400, status });
    const urls = () => mockFetch.mock.calls.map(([url]) => String(url));
    const run = async () => {
      const result = bootstrapAnonymousSession();
      const settled = result.catch(() => undefined);
      await vi.runAllTimersAsync();
      await settled;
      return result;
    };

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('returns the session without logging when sign-in works first time', async () => {
      mockFetch
        .mockResolvedValueOnce(signInResponse(200))
        .mockResolvedValueOnce(sessionResponse(user));

      await expect(run()).resolves.toEqual(user);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('treats a sign-in 400 as success when a session already exists, and logs it', async () => {
      mockFetch
        .mockResolvedValueOnce(signInResponse(400))
        .mockResolvedValueOnce(sessionResponse(user));

      await expect(run()).resolves.toEqual(user);
      expect(urls().filter((u) => u.includes('sign-in'))).toHaveLength(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Anonymous bootstrap recovered',
        expect.objectContaining({
          level: 'warning',
          fingerprint: ['anonymous-bootstrap-recovered', 'existing-session', '400'],
        }),
      );
    });

    it('retries after a network failure and logs the recovery', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(sessionResponse(null)) // no session yet
        .mockResolvedValueOnce(signInResponse(200))
        .mockResolvedValueOnce(sessionResponse(user));

      await expect(run()).resolves.toEqual(user);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Anonymous bootstrap recovered',
        expect.objectContaining({
          fingerprint: ['anonymous-bootstrap-recovered', 'retried', 'network'],
        }),
      );
    });

    it('does not retry a 429 and rethrows when no session exists', async () => {
      mockFetch
        .mockResolvedValueOnce(signInResponse(429))
        .mockResolvedValueOnce(sessionResponse(null));

      await expect(run()).rejects.toThrow('Failed to bootstrap anonymous session');
      expect(urls().filter((u) => u.includes('sign-in'))).toHaveLength(1);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('polls get-session, never sign-in, while the new cookie is not readable yet', async () => {
      mockFetch
        .mockResolvedValueOnce(signInResponse(200))
        .mockResolvedValueOnce(sessionResponse(null))
        .mockResolvedValueOnce(sessionResponse(user));

      await expect(run()).resolves.toEqual(user);
      expect(urls().filter((u) => u.includes('sign-in'))).toHaveLength(1);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Anonymous bootstrap recovered',
        expect.objectContaining({
          fingerprint: ['anonymous-bootstrap-recovered', 'delayed-session', 'ok'],
        }),
      );
    });

    it('fails with "did not start" when the session never appears', async () => {
      mockFetch
        .mockResolvedValueOnce(signInResponse(200))
        .mockResolvedValue(sessionResponse(null));

      await expect(run()).rejects.toThrow('Anonymous session did not start');
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});
