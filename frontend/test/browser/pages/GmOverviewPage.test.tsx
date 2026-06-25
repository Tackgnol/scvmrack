import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { GmOverviewPage } from '@/pages/GmOverviewPage';
import { useAuth } from '@/hooks/useAuth';
import { useCreateParty, usePartyList } from '@/hooks/usePartyRepository';
import { appHistory } from '@/router/history';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import i18n, { loadLanguage } from '@/i18n';

type MockLinkProps = { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock('@/seo/Seo', () => ({ Seo: () => null }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/router/history', () => ({
  appHistory: { push: vi.fn().mockResolvedValue({ type: 'PUSHED' }), flush: vi.fn() },
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/usePartyRepository', () => ({
  usePartyList: vi.fn(),
  useCreateParty: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUsePartyList = vi.mocked(usePartyList);
const mockedUseCreateParty = vi.mocked(useCreateParty);

function authed() {
  mockedUseAuth.mockReturnValue({ isAuthenticated: true, isGuest: false, isLoading: false } as never);
}
function partyList(over: Partial<ReturnType<typeof usePartyList>> = {}) {
  mockedUsePartyList.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...over,
  } as never);
}
function createParty(mutateAsync = vi.fn()) {
  mockedUseCreateParty.mockReturnValue({ mutateAsync, isPending: false } as never);
  return mutateAsync;
}

const renderPage = () =>
  render(
    <BrowserTestProvider>
      <GmOverviewPage />
    </BrowserTestProvider>
  );

describe('GmOverviewPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
    authed();
    partyList();
    createParty();
  });
  afterEach(() => vi.clearAllMocks());

  it('shows the guest warning when not logged in', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, isGuest: true, isLoading: false } as never);
    await renderPage();
    await expect.element(page.getByTestId('gm-guest-warning')).toBeVisible();
  });

  it('shows the empty state with no parties', async () => {
    await renderPage();
    await expect.element(page.getByTestId('gm-empty')).toBeVisible();
  });

  it('renders legible black text inside the yellow party-name input', async () => {
    await renderPage();

    const input = page.getByRole('textbox', { name: /party name/i });
    await expect.element(input).toBeVisible();

    expect(getComputedStyle(input.element()!).color).toBe('rgb(10, 10, 10)');
  });

  it('keeps the party-name input aligned with the create button when validation appears', async () => {
    await renderPage();

    const input = page.getByRole('textbox', { name: /party name/i });
    const button = page.getByRole('button', { name: /create party/i });
    await expect.element(input).toBeVisible();
    await expect.element(button).toBeVisible();
    expect(document.body.textContent).not.toContain('0/100');

    const getControlTops = () => {
      const inputFrame = input.element()!.closest('.MuiInputBase-root');
      if (!inputFrame) {
        throw new Error('Expected the party-name input frame to render');
      }

      return {
        input: Math.round(inputFrame.getBoundingClientRect().top),
        button: Math.round(button.element()!.getBoundingClientRect().top),
      };
    };

    const initial = getControlTops();
    expect(Math.abs(initial.input - initial.button)).toBeLessThanOrEqual(2);

    await userEvent.fill(input, 'x'.repeat(101));
    await expect.element(page.getByText('Keep it to 100 characters or fewer.')).toBeVisible();

    const invalid = getControlTops();
    expect(Math.abs(invalid.input - invalid.button)).toBeLessThanOrEqual(2);
    expect(Math.abs(invalid.input - initial.input)).toBeLessThanOrEqual(2);
  });

  it('renders owned parties with member counts', async () => {
    partyList({
      data: [
        { id: 'p1', name: 'The Doomed', inviteToken: 't', invitePath: '/join/t', memberCount: 2, maxMembers: 10 },
      ],
    } as never);
    await renderPage();
    await expect.element(page.getByText('The Doomed')).toBeVisible();
  });

  it('renders the party controls in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    partyList({
      data: [
        { id: 'p1', name: 'Pest control', inviteToken: 't', invitePath: '/join/t', memberCount: 3, maxMembers: 10 },
      ],
    } as never);

    await renderPage();

    await expect.element(page.getByRole('heading', { name: /kontrola kompanii/i })).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: /nazwa kompanii/i })).toBeVisible();
    await expect.element(page.getByRole('button', { name: /utwórz kompanię/i })).toBeVisible();
    await expect.element(page.getByText('3/10 scvmów')).toBeVisible();
    await expect.element(page.getByText('Zarządzaj')).toBeVisible();
  });

  it('shows the party-name length validation in Polish', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'new-party' });
    createParty(mutateAsync);
    await renderPage();

    await userEvent.fill(page.getByRole('textbox', { name: /nazwa kompanii/i }), 'x'.repeat(101));

    await expect.element(page.getByText('Maksymalnie 100 znaków.')).toBeVisible();
    await expect.element(page.getByRole('button', { name: /utwórz kompanię/i })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('creates a party and navigates to it', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'new-party' });
    createParty(mutateAsync);
    await renderPage();

    await userEvent.fill(page.getByRole('textbox'), 'Sarkash Six');
    await userEvent.click(page.getByRole('button', { name: /create party/i }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('Sarkash Six'));
    await vi.waitFor(() =>
      expect(vi.mocked(appHistory.push)).toHaveBeenCalledWith('/party/new-party')
    );
  });

  it('blocks party creation when the name is over 100 characters', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'new-party' });
    createParty(mutateAsync);
    await renderPage();

    await userEvent.fill(page.getByRole('textbox'), 'x'.repeat(101));

    await expect.element(page.getByText('Keep it to 100 characters or fewer.')).toBeVisible();
    await expect.element(page.getByRole('button', { name: /create party/i })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('surfaces a party-list load error with retry', async () => {
    partyList({ error: new Error('boom') } as never);
    await renderPage();
    await expect.element(page.getByTestId('gm-error')).toBeVisible();
  });
});
