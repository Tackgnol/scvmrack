import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { LandingPage } from '@/pages/LandingPage';
import { buildHomeCallbackUrl } from '@/router/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockLinkProps = {
  children: ReactNode;
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const mockFetch = vi.fn();

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

describe('LandingPage', () => {
  const renderLanding = () =>
    render(
      <BrowserTestProvider>
        <LandingPage />
      </BrowserTestProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('links the Open sheet CTA to the sheet bootstrap route', async () => {
    await renderLanding();

    await expect
      .element(page.getByRole('link', { name: /open sheet/i }))
      .toHaveAttribute('href', '/character');
    expect(buildHomeCallbackUrl).toHaveBeenCalledWith(null);
  });

  it('does not pre-generate a character from the landing page', async () => {
    await renderLanding();

    await expect.element(page.getByRole('link', { name: /open sheet/i })).toBeVisible();
    // Pre-generation was removed; the landing makes no character/list API calls.
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('links the production credit to the author site', async () => {
    await renderLanding();

    await expect
      .element(page.getByRole('link', { name: /adam kościelniak/i }))
      .toHaveAttribute('href', 'https://adamkoscielniak.me');
  });
});
