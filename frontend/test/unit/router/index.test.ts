import { describe, it, expect, vi } from 'vitest';

// createBrowserHistory needs window.location — mock the module so the router
// can be imported in JSDOM without a real browser history implementation.
vi.mock('@/router/history', () => ({
  appHistory: {
    location: { pathname: '/', search: '', hash: '', state: {} },
    listen: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    destroy: vi.fn(),
  },
}));

// Route components are lazy-loaded — mock them so importing the router
// doesn't pull in every page's dependency tree.
vi.mock('@/pages/CharacterPage', () => ({ CharacterPage: () => null }));
vi.mock('@/pages/CharacterCreatePage', () => ({ CharacterCreatePage: () => null }));
vi.mock('@/pages/CharactersListPage', () => ({ CharactersListPage: () => null }));
vi.mock('@/pages/FaqPage', () => ({ FaqPage: () => null }));
vi.mock('@/pages/NotFoundPage', () => ({ NotFoundPage: () => null }));
vi.mock('@/pages/PrintPage', () => ({ PrintPage: () => null }));
vi.mock('@/pages/ReleasePage', () => ({ ReleasePage: () => null }));
vi.mock('@/router/layout', () => ({ RootLayout: () => null }));

describe('router/index — route registration', () => {
  it('registers all expected route paths', async () => {
    const { router } = await import('@/router/index');
    const registeredPaths = Object.keys(router.routesById);

    expect(registeredPaths).toContain('/');
    expect(registeredPaths).toContain('/characters');
    expect(registeredPaths).toContain('/character/');
    expect(registeredPaths).toContain('/character/create');
    expect(registeredPaths).toContain('/character/new');
    expect(registeredPaths).toContain('/print');
    expect(registeredPaths).toContain('/faq');
    expect(registeredPaths).toContain('/release');
    expect(registeredPaths).toContain('/join/$token');
    expect(registeredPaths).toContain('/join/$token/forge');
    expect(registeredPaths).toContain('/join/$token/roll');
    expect(registeredPaths).not.toContain('/reset-password');
  });

  it('matches the dedicated join forge/roll routes ahead of the bare invite route', async () => {
    const { router } = await import('@/router/index');

    const forge = router.matchRoutes('/join/abc/forge');
    expect(forge[forge.length - 1]?.routeId).toBe('/join/$token/forge');

    const roll = router.matchRoutes('/join/abc/roll');
    expect(roll[roll.length - 1]?.routeId).toBe('/join/$token/roll');

    const invite = router.matchRoutes('/join/abc');
    expect(invite[invite.length - 1]?.routeId).toBe('/join/$token');
  });

  it('treats /character/ as not found instead of an empty sheet shell', async () => {
    const { router } = await import('@/router/index');
    const matches = router.matchRoutes('/character/');

    expect(matches[matches.length - 1]?.routeId).toBe('/character/');
  });

  it('routes /character/new to the sheet bootstrap page', async () => {
    const { router } = await import('@/router/index');
    const matches = router.matchRoutes('/character/new');

    expect(matches[matches.length - 1]?.routeId).toBe('/character/new');
  });
});
