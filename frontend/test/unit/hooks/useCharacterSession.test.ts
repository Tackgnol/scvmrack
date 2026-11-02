import { renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useCharacterSession } from '@/hooks/useCharacterSession';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/privacy/privacyConsent', () => ({ usePrivacyAcknowledged: () => true }));
it.each([true, false])('rejects malformed sheet references without session bootstrap or an expired-session error (sessionless=%s)', isSessionless => {
  vi.mocked(useAuth).mockReturnValue({ isLoading: false, isSessionless, isAuthenticated: !isSessionless, error: null } as never);
  const { result } = renderHook(() => useCharacterSession({ pathname: '/character/bad-id', characterId: 'bad-id', isJustLoggedOut: false }));
  expect(result.current.canReadCharacter).toBe(false);
  expect(result.current.error).toBeNull();
  expect(useAuth).toHaveBeenLastCalledWith({ bootstrapAnonymous: false });
});


it('identifies a sessionless sheet request as requiring sign-in rather than an expired session', () => {
  vi.mocked(useAuth).mockReturnValue({ isLoading: false, isSessionless: true, error: null } as never);
  const { result } = renderHook(() => useCharacterSession({ pathname: '/character/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', characterId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', isJustLoggedOut: false }));
  expect(result.current.canReadCharacter).toBe(false);
  expect(result.current.error).toMatchObject({ code: 'CHARACTER_SESSION_REQUIRED' });
  expect(useAuth).toHaveBeenLastCalledWith({ bootstrapAnonymous: false });
});
