import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrowserTestProvider from '../BrowserTestProvider';
import { ClassesPage } from '@/pages/ClassesPage';
import { listMyClasses } from '@/api/classes';
import { useAuth } from '@/hooks/useAuth';

type MockLinkProps = { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock('@/seo/Seo', () => ({ Seo: () => null }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/api/classes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/classes')>()),
  listMyClasses: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserTestProvider>
        <ClassesPage />
      </BrowserTestProvider>
    </QueryClientProvider>
  );
}

describe('ClassesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, isGuest: false, isLoading: false } as ReturnType<typeof useAuth>);
  });

  it('lists the GM classes as the server orders them, each private one with Edit', async () => {
    vi.mocked(listMyClasses).mockResolvedValue([
      { id: 9, lineageId: 'b', name: 'Bog Witch', description: 'The mire keeps.', languages: ['en'], visibility: 'private', status: 'active', originCount: 1 },
      { id: 4, lineageId: 'a', name: 'Chain Monk', description: null, languages: ['en', 'pl'], visibility: 'private', status: 'active', originCount: 3 },
    ]);
    renderPage();

    await expect.element(page.getByTestId('own-class').first()).toHaveTextContent('Bog Witch');
    await expect.element(page.getByText('English · Private · 1 origin')).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Edit Bog Witch' })).toHaveAttribute('href', '/gm/classes/9');
    await expect.element(page.getByRole('link', { name: 'Forge a class' })).toHaveAttribute('href', '/gm/classes/new');
  });

  it('tells guests to log in instead of offering the creator', async () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, isGuest: true, isLoading: false } as ReturnType<typeof useAuth>);
    renderPage();

    await expect.element(page.getByText('You need to be logged in to forge classes.')).toBeVisible();
    await expect.element(page.getByRole('link', { name: 'Forge a class' })).not.toBeInTheDocument();
    expect(listMyClasses).not.toHaveBeenCalled();
  });
});
