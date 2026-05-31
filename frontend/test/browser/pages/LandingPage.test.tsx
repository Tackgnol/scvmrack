import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { LandingPage } from '@/pages/LandingPage';
import { buildHomeCallbackUrl } from '@/router/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCharacterId } from '@/hooks/useCharacterId';
import { useCharacterRepository } from '@/hooks/useCharacterRepository';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockLinkProps = {
  children: ReactNode;
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const createCharacter = vi.fn();
const setCharacterId = vi.fn();
const mockFetch = vi.fn();

const getOpenSheetHref = () =>
  Array.from(document.querySelectorAll('a'))
    .find((anchor) => /open sheet|rolling a scvm/i.test(anchor.textContent ?? ''))
    ?.getAttribute('href');

vi.mock('@/seo/Seo', () => ({
  Seo: () => null,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/router/navigation', () => ({
  buildHomeCallbackUrl: vi.fn((characterId: string | null) =>
    characterId ? `/character/${characterId}` : '/character'
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useCharacterId', () => ({
  useCharacterId: vi.fn(),
}));

vi.mock('@/hooks/useCharacterRepository', () => ({
  useCharacterRepository: vi.fn(),
}));

describe('LandingPage', () => {
  const renderLanding = async ({
    authLoading = false,
    lastCharacterId = null,
  }: {
    authLoading?: boolean;
    lastCharacterId?: string | null;
  } = {}) => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: authLoading,
    } as ReturnType<typeof useAuth>);
    vi.mocked(useCharacterId).mockReturnValue({
      lastCharacterId,
      setCharacterId,
    } as unknown as ReturnType<typeof useCharacterId>);
    vi.mocked(useCharacterRepository).mockReturnValue({
      createCharacter: {
        mutateAsync: createCharacter,
      },
    } as unknown as ReturnType<typeof useCharacterRepository>);

    return render(
      <BrowserTestProvider>
        <LandingPage />
      </BrowserTestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.stubGlobal('fetch', mockFetch);
    setCharacterId.mockResolvedValue(undefined);
    createCharacter.mockResolvedValue({ id: 'created-char' });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the CTA on the safe sheet bootstrap route while preparing the first character', async () => {
    let resolveFetch: (value: { ok: boolean; json: () => Promise<Array<{ id: string }>> }) => void =
      () => {};
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    await renderLanding();

    await expect
      .element(page.getByRole('link', { name: /open sheet/i }))
      .toHaveAttribute('href', '/character');
    expect(buildHomeCallbackUrl).toHaveBeenCalledWith(null);

    resolveFetch({
      ok: true,
      json: async () => [],
    });
    await expect.poll(() => createCharacter).toHaveBeenCalled();
  });

  it('links the CTA to the remembered character', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'char-1' }],
    });

    await renderLanding({ lastCharacterId: 'char-1' });

    await expect.poll(getOpenSheetHref).toBe('/character/char-1');
    expect(setCharacterId).toHaveBeenCalledWith('char-1');
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it('keeps a stale remembered id out of the CTA until validation finishes', async () => {
    let resolveFetch: (value: { ok: boolean; json: () => Promise<Array<{ id: string }>> }) => void =
      () => {};
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    await renderLanding({ lastCharacterId: 'stale-char' });

    await expect
      .element(page.getByRole('link', { name: /open sheet/i }))
      .toHaveAttribute('href', '/character');

    resolveFetch({
      ok: true,
      json: async () => [{ id: 'existing-char' }],
    });

    await expect.poll(getOpenSheetHref).toBe('/character/existing-char');
    expect(setCharacterId).toHaveBeenCalledWith('existing-char');
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it('skips background pregen while auth is loading', async () => {
    await renderLanding({ authLoading: true });

    await expect.element(page.getByRole('link', { name: /open sheet/i })).toBeVisible();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it('skips background pregen after this session already attempted it', async () => {
    window.sessionStorage.setItem('scvmrack:pregen-attempted', '1');

    await renderLanding();

    await expect.element(page.getByRole('link', { name: /open sheet/i })).toBeVisible();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it('selects an existing character during background pregen', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'existing-char' }],
    });

    await renderLanding();

    await expect.poll(() => setCharacterId).toHaveBeenCalledWith('existing-char');
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it('creates and stores a character when none exists', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    createCharacter.mockResolvedValueOnce({ id: 'new-char' });

    await renderLanding();

    await expect.poll(() => createCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {},
        params: { query: { locale: 'en' } },
        signal: expect.any(AbortSignal),
      })
    );
    await expect.poll(() => setCharacterId).toHaveBeenCalledWith('new-char');
  });

  it('keeps the landing page usable when background pregen fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));

    await renderLanding();

    await expect.element(page.getByRole('link', { name: /open sheet/i })).toBeVisible();
    await expect.poll(() => setCharacterId).not.toHaveBeenCalled();
  });

  it('links the production credit to the author site', async () => {
    await renderLanding({ authLoading: true });

    await expect
      .element(page.getByRole('link', { name: /adam kościelniak/i }))
      .toHaveAttribute('href', 'https://adamkoscielniak.me');
  });
});
