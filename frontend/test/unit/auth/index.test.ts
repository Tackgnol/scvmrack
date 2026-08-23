import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchSession,
  loginUrl,
  profileUrl,
  signInAnonymous,
  signOut,
} from '@/auth';

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
      { credentials: 'include', headers: {} }
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
});
