import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { RootLayout } from '@/router/layout';
import BrowserTestProvider from '../BrowserTestProvider';

// TanStack Router hooks — provide minimal state
vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn().mockImplementation((opts) => {
    const state = { location: { pathname: '/' } };
    return opts?.select ? opts.select(state) : state;
  }),
  Outlet: () => <div data-testid="outlet-content">Page Content</div>,
}));

// Heavy children mocked — each is tested in its own suite
vi.mock('@components/index', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
  NetworkActivityIndicator: () => <div data-testid="mock-network-indicator" />,
  PrivacyNoticeDrawer: () => null,
}));

vi.mock('@/analytics/AnalyticsPageTracker', () => ({
  AnalyticsPageTracker: () => null,
}));

describe('RootLayout Browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main content area', async () => {
    await render(
      <BrowserTestProvider>
        <RootLayout />
      </BrowserTestProvider>
    );

    const main = page.getByRole('main');
    await expect.element(main).toBeInTheDocument();
  });

  it('renders the Header', async () => {
    await render(
      <BrowserTestProvider>
        <RootLayout />
      </BrowserTestProvider>
    );

    await expect.element(page.getByTestId('mock-header')).toBeVisible();
  });

  it('renders Outlet content inside main', async () => {
    await render(
      <BrowserTestProvider>
        <RootLayout />
      </BrowserTestProvider>
    );

    await expect.element(page.getByTestId('outlet-content')).toBeVisible();
  });

  it('gives main the id="main-content" for skip-nav accessibility', async () => {
    await render(
      <BrowserTestProvider>
        <RootLayout />
      </BrowserTestProvider>
    );

    const main = page.getByRole('main');
    await expect.element(main).toHaveAttribute('id', 'main-content');
  });

  it('re-keys main on pathname change to trigger fade animation', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <RootLayout />
      </BrowserTestProvider>
    );

    const { useRouterState } = await import('@tanstack/react-router');
    vi.mocked(useRouterState).mockImplementation((opts) => {
      const state = { location: { pathname: '/characters' } };
      return opts?.select ? opts.select(state) : state;
    });

    await rerender(
      <BrowserTestProvider>
        <RootLayout />
      </BrowserTestProvider>
    );

    // main is still present after navigation
    await expect.element(page.getByRole('main')).toBeInTheDocument();
    await expect.element(page.getByTestId('outlet-content')).toBeVisible();
  });
});
