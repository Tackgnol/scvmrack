import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';

const sessionMocks = vi.hoisted(() => ({
  isSessionExpired: false,
  clearSessionExpiredFlag: vi.fn(async () => {}),
}));

const authKindMock = vi.hoisted(() => ({
  value: null as 'account' | 'anonymous' | null,
}));

const navMocks = vi.hoisted(() => ({
  clearCurrentSearchParam: vi.fn(async (_param: string) => {}),
}));

vi.mock('@components/molecules/modal/MorkBorgModal', () => ({
  default: ({
    open,
    title,
    children,
    actions,
  }: {
    open: boolean;
    title: ReactNode;
    children: ReactNode;
    actions: ReactNode;
  }) =>
    open ? (
      <div data-testid="modal">
        <div>{title}</div>
        {children}
        <div>{actions}</div>
      </div>
    ) : null,
  ModalButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/hooks/useSessionExpiredFlag', () => ({
  useSessionExpiredFlag: () => ({
    isSessionExpired: sessionMocks.isSessionExpired,
    clearSessionExpiredFlag: sessionMocks.clearSessionExpiredFlag,
  }),
}));

vi.mock('@/preferences/lastAuthKind', () => ({
  getLastAuthKind: () => authKindMock.value,
}));

vi.mock('@/router/navigation', () => ({
  CHARACTER_ID_QUERY_PARAM: 'character',
  clearCurrentSearchParam: navMocks.clearCurrentSearchParam,
}));

vi.mock('@/auth', () => ({
  loginUrl: () => 'https://login.example/start',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

import { SessionExpiredGate } from '../../../src/components/molecules/session/SessionExpiredGate.tsx';

beforeEach(() => {
  sessionMocks.isSessionExpired = false;
  sessionMocks.clearSessionExpiredFlag.mockClear();
  navMocks.clearCurrentSearchParam.mockClear();
  authKindMock.value = null;
});

test('renders nothing and does not touch the URL when the session is valid', () => {
  sessionMocks.isSessionExpired = false;
  const { container } = render(<SessionExpiredGate />);

  expect(container.firstChild).toBeNull();
  expect(navMocks.clearCurrentSearchParam).not.toHaveBeenCalled();
  expect(sessionMocks.clearSessionExpiredFlag).not.toHaveBeenCalled();
});

test('silently self-heals an expired guest: clears stale id + flag, shows no modal', async () => {
  sessionMocks.isSessionExpired = true;
  authKindMock.value = 'anonymous';

  const { container } = render(<SessionExpiredGate />);

  expect(container.firstChild).toBeNull();
  await waitFor(() => {
    expect(navMocks.clearCurrentSearchParam).toHaveBeenCalledWith('character');
    expect(sessionMocks.clearSessionExpiredFlag).toHaveBeenCalled();
  });
});

test('treats unknown auth kind as a guest and self-heals silently', async () => {
  sessionMocks.isSessionExpired = true;
  authKindMock.value = null;

  const { container } = render(<SessionExpiredGate />);

  expect(container.firstChild).toBeNull();
  await waitFor(() => {
    expect(sessionMocks.clearSessionExpiredFlag).toHaveBeenCalled();
  });
});

test('prompts an expired account instead of healing silently', () => {
  sessionMocks.isSessionExpired = true;
  authKindMock.value = 'account';

  render(<SessionExpiredGate />);

  expect(screen.getByTestId('modal')).toBeTruthy();
  expect(screen.getByText('Sign in')).toBeTruthy();
  expect(screen.getByText('Continue as guest')).toBeTruthy();
  // Must NOT silently rewrite the URL for a real account.
  expect(navMocks.clearCurrentSearchParam).not.toHaveBeenCalled();
  expect(sessionMocks.clearSessionExpiredFlag).not.toHaveBeenCalled();
});

test('"Continue as guest" drops the expired flag so a guest session can bootstrap', () => {
  sessionMocks.isSessionExpired = true;
  authKindMock.value = 'account';

  render(<SessionExpiredGate />);
  fireEvent.click(screen.getByText('Continue as guest'));

  expect(sessionMocks.clearSessionExpiredFlag).toHaveBeenCalled();
});
