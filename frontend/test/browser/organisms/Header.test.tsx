import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import Header from '@/components/organisms/Header';
import BrowserTestProvider from '../BrowserTestProvider';
import * as AuthContextModule from '@/hooks/useAuth';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';
import * as AuthLinks from '@/auth';
import { $api } from '@/api';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

vi.mock('@/auth', () => ({
  loginUrl: vi.fn(() => '/api/auth/oauth2/login/logto'),
  profileUrl: vi.fn(() => 'https://auth.example.test/profile'),
}));

vi.mock('@/api', () => ({
  $api: {
    useQuery: vi.fn(),
  },
}));

vi.mock('@/router/navigation', () => ({
  buildHomeCallbackUrl: vi.fn().mockReturnValue('/home'),
  buildPrintCallbackUrl: vi.fn().mockReturnValue('/print'),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn().mockImplementation((opts) => {
    const state = { location: { pathname: '/' } };
    return opts?.select ? opts.select(state) : state;
  }),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/router/history', () => ({
  appHistory: { push: vi.fn() },
}));

describe('Header Component', () => {
  const renderHeader = async (overrides = {}) => {
    const {
      auth = {},
      character = {},
      queryReturn = undefined as any,
    } = overrides as any;

    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      signOut: { mutateAsync: vi.fn(), isPending: false },
      ...auth,
    } as any);

    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      isSaving: false,
      isJustLoggedOut: false,
      character: null,
      characterId: null,
      lastCharacterId: null,
      validationIssues: [],
      ...character,
    } as any);

    vi.mocked($api.useQuery).mockReturnValue({
      data: queryReturn,
    } as any);

    return render(
      <BrowserTestProvider>
        <Header />
      </BrowserTestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Header title and top bar interactions correctly', async () => {
    await renderHeader();

    const title = page.getByTestId('app-title');
    await expect.element(title).toBeInTheDocument();

    const printBtn = page.getByTestId('header-print-button');
    await expect.element(printBtn).toBeVisible();
  });

  it('displays the saving chip when isSaving is true', async () => {
    await renderHeader({ character: { isSaving: true } });

    const savingChip = page.getByTestId('saving-chip');
    // Wait for it because showSaving has a 140ms delay
    await expect.element(savingChip).toBeVisible();
  });

  it('displays the synced chip when isSaving is false', async () => {
    await renderHeader({ character: { isSaving: false } });

    const syncedChip = page.getByTestId('synced-chip');
    await expect.element(syncedChip).toBeVisible();
  });

  it('concatenates active validation issues in the top bar', async () => {
    await renderHeader({
      character: {
        validationIssues: [
          {
            id: 'modifier:quick:value',
            message: 'Modifier value must be -20 to +20',
          },
          {
            id: 'field:name',
            message: 'Name max 255 chars',
          },
        ],
      },
    });

    const validationChip = page.getByTestId('validation-issues-chip');
    await expect.element(validationChip).toBeVisible();
    await expect
      .element(validationChip)
      .toHaveTextContent(
        /Fix: Modifier value must be -20 to \+20 · Name max 255 chars/i
      );
  });

  it('links logged-out users to Logto login', async () => {
    await renderHeader();

    const authBtn = page.getByTestId('auth-button');
    await expect.element(authBtn).toHaveAttribute('href', '/api/auth/oauth2/login/logto');
    expect(AuthLinks.loginUrl).toHaveBeenCalled();
  });

  it('shows total count if query data exists', async () => {
    await renderHeader({
      queryReturn: { total: 42 },
    });

    const badge = page.getByTestId('scvm-count-badge');
    await expect.element(badge).toBeVisible();
    await expect.element(badge).toHaveTextContent(/42 SCVMS/i);
  });

  it('links authenticated users to Logto profile and signs out separately', async () => {
    const signOut = { mutateAsync: vi.fn(), isPending: false };
    await renderHeader({
      auth: { isAuthenticated: true, signOut },
    });

    const authBtn = page.getByTestId('auth-button');
    await expect.element(authBtn).toHaveAttribute('href', 'https://auth.example.test/profile');
    await expect.element(authBtn).toHaveAttribute('target', '_blank');
    expect(AuthLinks.profileUrl).toHaveBeenCalled();

    await userEvent.click(page.getByTestId('logout-button'));
    await expect.poll(() => signOut.mutateAsync).toHaveBeenCalled();
  });
});
