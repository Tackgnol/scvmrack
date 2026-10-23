import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider } from '@tanstack/react-router';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { beforeEach, expect, it, vi } from 'vitest';
import { createClassDraft, getClass, getClassDraft, getMyCreationBan, listClassDrafts, listMyClasses, saveClass, type OwnClassSummary, type SavedClass, type StoredClassDraft } from '@/api/classes';
import { blankDraft } from '@/components/organisms/class-creator/creatorShared.utils';
import { ClassesPage } from '@/pages/ClassesPage';
import { ClassCreatorPage } from '@/pages/ClassCreatorPage';
import BrowserTestProvider from '../BrowserTestProvider';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }));
vi.mock('@/api/classes', async importOriginal => ({
  ...await importOriginal<typeof import('@/api/classes')>(),
  createClassDraft: vi.fn(), getClass: vi.fn(), getClassDraft: vi.fn(),
  getMyCreationBan: vi.fn(), listClassDrafts: vi.fn(), listMyClasses: vi.fn(), saveClass: vi.fn(),
}));

function ClassManagementNavigation() {
  return <><Link to="/gm/classes">My classes</Link><Outlet /></>;
}

async function openManagement() {
  const root = createRootRoute({ component: ClassManagementNavigation });
  const routes = [
    createRoute({ getParentRoute: () => root, path: '/gm/classes', component: ClassesPage }),
    createRoute({ getParentRoute: () => root, path: '/gm/classes/new', component: ClassCreatorPage }),
    createRoute({ getParentRoute: () => root, path: '/gm/classes/draft/$draftId', component: ClassCreatorPage }),
    createRoute({ getParentRoute: () => root, path: '/gm/classes/$classId', component: ClassCreatorPage }),
  ];
  const router = createRouter({ routeTree: root.addChildren(routes), history: createMemoryHistory({ initialEntries: ['/gm/classes'] }) });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000 }, mutations: { retry: false } } });
  await render(<QueryClientProvider client={client}><BrowserTestProvider><RouterProvider router={router} /></BrowserTestProvider></QueryClientProvider>);
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMyCreationBan).mockResolvedValue({ banned: false });
  vi.mocked(listClassDrafts).mockResolvedValue([]);
  vi.mocked(listMyClasses).mockResolvedValue([]);
});

it('discovers and resumes an autosaved new draft through normal navigation (RPG-324)', async () => {
  const record: StoredClassDraft = { id: 14, classId: null, draft: { ...blankDraft(), name: { en: 'Ash Navigator', pl: '' } }, revision: 1, updatedAt: '2026-10-23T12:00:00Z', expiresAt: '2027-01-21T12:00:00Z' };
  vi.mocked(createClassDraft).mockImplementation(async () => {
    vi.mocked(listClassDrafts).mockResolvedValue([record]);
    return record;
  });
  vi.mocked(getClassDraft).mockResolvedValue(record);
  await openManagement();
  await expect.element(page.getByRole('heading', { name: 'My classes', exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: 'Forge a class', exact: true }));
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Ash Navigator');
  await expect.element(page.getByText(/^Draft saved ·/)).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: 'My classes', exact: true }));
  await expect.element(page.getByText('Ash Navigator', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: 'Resume', exact: true }));
  await expect.element(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('Ash Navigator');
});

it('edits the latest saved version after returning to My classes (RPG-324)', async () => {
  const draft = { ...blankDraft(), name: { en: 'Ash Navigator', pl: '' }, description: { en: 'Follow the ash road.', pl: '' }, origins: [{ en: 'A burnt chapel', pl: '' }] };
  const earlier: SavedClass = { id: 16, version: 1, status: 'active', playingCount: 1, takenDownAt: null, takedownReason: null, draft };
  const summary: OwnClassSummary = { id: 16, lineageId: 'navigator', name: 'Ash Navigator', description: 'Follow the ash road.', languages: ['en'], visibility: 'private', status: 'active', originCount: 1, takenDownAt: null, takedownReason: null, everPublished: false };
  vi.mocked(listMyClasses).mockResolvedValue([summary]);
  vi.mocked(getClass).mockImplementation(async id => id === 16 ? earlier : { ...earlier, id: 17, version: 2, draft: { ...draft, name: { en: 'Ash Navigator II', pl: '' } } });
  vi.mocked(saveClass).mockImplementation(async input => {
    vi.mocked(listMyClasses).mockResolvedValue([{ ...summary, id: 17, name: 'Ash Navigator II' }]);
    return { ...earlier, id: 17, version: 2, draft: input.draft, savedRefs: {} };
  });
  await openManagement();
  await userEvent.click(page.getByRole('link', { name: 'Edit Ash Navigator', exact: true }));
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Ash Navigator II');
  await userEvent.click(page.getByRole('button', { name: /Test roll & save/ }).first());
  await userEvent.click(page.getByRole('button', { name: 'Save class', exact: true }));
  await expect.element(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: 'My classes', exact: true }));
  await expect.element(page.getByRole('link', { name: 'Edit Ash Navigator II', exact: true })).toHaveAttribute('href', '/gm/classes/17');
  await userEvent.click(page.getByRole('link', { name: 'Edit Ash Navigator II', exact: true }));
  await expect.element(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('Ash Navigator II');
});
