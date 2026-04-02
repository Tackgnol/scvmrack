import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({
  useRouterState: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  clearCurrentSearchParam: vi.fn(async (_param: string) => {}),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouterState: routerMocks.useRouterState,
}));

vi.mock('@/router/navigation', () => ({
  SESSION_EXPIRED_QUERY_PARAM: 'expired',
  clearCurrentSearchParam: navigationMocks.clearCurrentSearchParam,
}));

import { useSessionExpiredFlag } from '../../../src/hooks/useSessionExpiredFlag.ts';

beforeEach(() => {
  routerMocks.useRouterState.mockReset();
  navigationMocks.clearCurrentSearchParam.mockClear();
});

test('useSessionExpiredFlag reflects expired query flag and clears it', async () => {
  routerMocks.useRouterState.mockImplementation(
    ({ select }: { select: (state: { location: { searchStr: string } }) => boolean }) =>
      select({ location: { searchStr: '?expired=true' } }),
  );

  const { result } = renderHook(() => useSessionExpiredFlag());

  expect(result.current.isSessionExpired).toBe(true);

  await act(async () => {
    await result.current.clearSessionExpiredFlag();
  });

  expect(navigationMocks.clearCurrentSearchParam).toHaveBeenCalledWith('expired');
});

test('useSessionExpiredFlag reports false when expired query param is absent', () => {
  routerMocks.useRouterState.mockImplementation(
    ({ select }: { select: (state: { location: { searchStr: string } }) => boolean }) =>
      select({ location: { searchStr: '?foo=bar' } }),
  );

  const { result } = renderHook(() => useSessionExpiredFlag());
  expect(result.current.isSessionExpired).toBe(false);
});
