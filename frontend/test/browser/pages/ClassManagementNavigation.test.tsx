import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider } from '@tanstack/react-router';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { beforeEach, expect, it, vi } from 'vitest';
import { createClassDraft, deleteClassDraft, getClass, getClassDraft, getMyCreationBan, listClassDrafts, listMyClasses, saveClass, updateClassDraft, type OwnClassSummary, type SavedClass, type StoredClassDraft } from '@/api/classes';
import { blankDraft } from '@/components/organisms/class-creator/creatorShared.utils';
import { ClassesPage } from '@/pages/ClassesPage';
import { ClassCreatorPage } from '@/pages/ClassCreatorPage';
import BrowserTestProvider from '../BrowserTestProvider';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }));
vi.mock('@/api/classes', async importOriginal => ({
  ...await importOriginal<typeof import('@/api/classes')>(),
  createClassDraft: vi.fn(), updateClassDraft: vi.fn(), deleteClassDraft: vi.fn(), getClass: vi.fn(), getClassDraft: vi.fn(),
  getMyCreationBan: vi.fn(), listClassDrafts: vi.fn(), listMyClasses: vi.fn(), saveClass: vi.fn(),
}));

function ClassManagementNavigation() {
  return <><Link to="/gm/classes">My classes</Link><Outlet /></>;
}

async function openManagement(initialPath = '/gm/classes') {
  const root = createRootRoute({ component: ClassManagementNavigation });
  const routes = [
    createRoute({ getParentRoute: () => root, path: '/gm/classes', component: ClassesPage }),
    createRoute({ getParentRoute: () => root, path: '/gm/classes/new', component: ClassCreatorPage }),
    createRoute({ getParentRoute: () => root, path: '/gm/classes/draft/$draftId', component: ClassCreatorPage }),
    createRoute({ getParentRoute: () => root, path: '/gm/classes/$classId', component: ClassCreatorPage }),
  ];
  const router = createRouter({ routeTree: root.addChildren(routes), history: createMemoryHistory({ initialEntries: [initialPath] }) });
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

it.each(['create', 'update'] as const)('discovers a draft after its late navigation %s finishes (RPG-324)', async operation => {
  const earlier: StoredClassDraft = { id: 14, classId: null, draft: { ...blankDraft(), name: { en: 'Earlier draft', pl: '' } }, revision: 1, updatedAt: '2026-10-23T12:00:00Z', expiresAt: '2027-01-21T12:00:00Z' };
  const latest = { ...earlier, draft: { ...earlier.draft, name: { en: 'Latest Navigator', pl: '' } }, revision: 2 };
  let finishSave: () => void = () => { throw new Error('Navigation save has not started'); };
  const pendingSave = () => new Promise<StoredClassDraft>(resolve => {
    finishSave = () => {
      vi.mocked(listClassDrafts).mockResolvedValue([latest]);
      vi.mocked(getClassDraft).mockResolvedValue(latest);
      resolve(latest);
    };
  });
  vi.mocked(createClassDraft).mockImplementation(pendingSave);
  vi.mocked(updateClassDraft).mockImplementation(pendingSave);
  if (operation === 'update') {
    vi.mocked(listClassDrafts).mockResolvedValue([earlier]);
    vi.mocked(getClassDraft).mockResolvedValue(earlier);
  }
  await openManagement();
  await expect.element(page.getByRole('heading', { name: 'My classes', exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: operation === 'create' ? 'Forge a class' : 'Resume', exact: true }));
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Latest Navigator');
  const save = operation === 'create' ? createClassDraft : updateClassDraft;
  expect(save).not.toHaveBeenCalled();
  const reads = vi.mocked(listClassDrafts).mock.calls.length;
  await userEvent.click(page.getByRole('link', { name: 'My classes', exact: true }));
  await expect.poll(() => vi.mocked(listClassDrafts).mock.calls.length).toBeGreaterThan(reads);
  await expect.poll(() => save).toHaveBeenCalledTimes(1);
  await expect.element(page.getByRole('heading', { name: 'My classes', exact: true })).toBeVisible();
  finishSave();
  await expect.element(page.getByText('Latest Navigator', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: 'Resume', exact: true }));
  await expect.element(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('Latest Navigator');
});

it('keeps an existing class editor open when its own autosave finishes (RPG-324)', async () => {
  const draft = { ...blankDraft(), name: { en: 'Navigator', pl: '' } };
  vi.mocked(getClass).mockResolvedValue({ id: 16, version: 1, status: 'active', playingCount: 1, takenDownAt: null, takedownReason: null, draft });
  vi.mocked(createClassDraft).mockImplementation(async input => {
    const record: StoredClassDraft = { id: 14, classId: 16, draft: input.draft, revision: 1, updatedAt: '2026-10-23T12:00:00Z', expiresAt: '2027-01-21T12:00:00Z' };
    vi.mocked(listClassDrafts).mockResolvedValue([record]);
    return record;
  });
  vi.mocked(updateClassDraft).mockResolvedValue({ id: 14, classId: 16, draft, revision: 2, updatedAt: '2026-10-23T12:00:00Z', expiresAt: '2027-01-21T12:00:00Z' });
  await openManagement('/gm/classes/16');
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Navigator II');
  await expect.element(page.getByText(/^Draft saved ·/)).toBeVisible();
  await userEvent.fill(page.getByRole('textbox', { name: 'Description', exact: true }), 'Still editing this class.');
  await expect.element(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('Navigator II');
});

it('waits for edits queued behind an in-flight autosave before refreshing My classes (RPG-324)', async () => {
  let finishCreate: () => void = () => { throw new Error('Create has not started'); };
  let finishUpdate: () => void = () => { throw new Error('Update has not started'); };
  vi.mocked(createClassDraft).mockImplementation(input => new Promise(resolve => {
    finishCreate = () => {
      const record: StoredClassDraft = { id: 14, classId: null, draft: input.draft, revision: 1, updatedAt: '2026-10-23T12:00:00Z', expiresAt: '2027-01-21T12:00:00Z' };
      vi.mocked(listClassDrafts).mockResolvedValue([record]);
      resolve(record);
    };
  }));
  vi.mocked(updateClassDraft).mockImplementation(input => new Promise(resolve => {
    finishUpdate = () => {
      const record: StoredClassDraft = { id: 14, classId: null, draft: input.draft, revision: 2, updatedAt: '2026-10-23T12:00:01Z', expiresAt: '2027-01-21T12:00:01Z' };
      vi.mocked(listClassDrafts).mockResolvedValue([record]);
      vi.mocked(getClassDraft).mockResolvedValue(record);
      resolve(record);
    };
  }));
  await openManagement();
  await userEvent.click(page.getByRole('link', { name: 'Forge a class', exact: true }));
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Earlier Navigator');
  await expect.poll(() => createClassDraft).toHaveBeenCalledTimes(1);
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Latest Navigator');
  await userEvent.click(page.getByRole('link', { name: 'My classes', exact: true }));
  await expect.element(page.getByRole('heading', { name: 'My classes', exact: true })).toBeVisible();
  finishCreate();
  await expect.poll(() => updateClassDraft).toHaveBeenCalledTimes(1);
  finishUpdate();
  await expect.element(page.getByText('Latest Navigator', { exact: true })).toBeVisible();
  await userEvent.click(page.getByRole('link', { name: 'Resume', exact: true }));
  await expect.element(page.getByRole('textbox', { name: 'Class name', exact: true })).toHaveValue('Latest Navigator');
});

it.each(['before', 'after'] as const)('refreshes after consumed-draft deletion when autosave resolves %s the class save (RPG-324)', async order => {
  const draft = { ...blankDraft(), name: { en: 'Navigator', pl: '' }, description: { en: 'The ash road.', pl: '' }, origins: [{ en: 'A burnt chapel', pl: '' }] };
  vi.mocked(getClass).mockResolvedValue({ id: 16, version: 1, status: 'active', playingCount: 0, takenDownAt: null, takedownReason: null, draft });
  let finishCreate: () => void = () => { throw new Error('Create has not started'); };
  let finishDelete: () => void = () => { throw new Error('Delete has not started'); };
  let finishSave: () => void = () => { throw new Error('Save has not started'); };
  vi.mocked(createClassDraft).mockImplementation(input => new Promise(resolve => {
    finishCreate = () => {
      const record: StoredClassDraft = { id: 14, classId: 16, draft: input.draft, revision: 1, updatedAt: '2026-10-23T12:00:00Z', expiresAt: '2027-01-21T12:00:00Z' };
      vi.mocked(listClassDrafts).mockResolvedValue([record]);
      resolve(record);
    };
  }));
  vi.mocked(deleteClassDraft).mockImplementation(() => new Promise(resolve => {
    finishDelete = () => {
      vi.mocked(listClassDrafts).mockResolvedValue([]);
      resolve();
    };
  }));
  vi.mocked(saveClass).mockImplementation(input => new Promise(resolve => {
    finishSave = () => resolve({ id: 16, version: 1, status: 'active', playingCount: 0, takenDownAt: null, takedownReason: null, draft: input.draft, savedRefs: {} });
  }));
  await openManagement('/gm/classes/16');
  await userEvent.fill(page.getByRole('textbox', { name: 'Class name', exact: true }), 'Saved Navigator');
  await expect.poll(() => createClassDraft).toHaveBeenCalledTimes(1);
  await userEvent.click(page.getByRole('button', { name: /Test roll & save/ }).first());
  await userEvent.click(page.getByRole('button', { name: 'Save class', exact: true }));
  await expect.poll(() => saveClass).toHaveBeenCalledTimes(1);
  if (order === 'before') {
    finishCreate();
    await expect.element(page.getByText(/^Draft saved ·/)).toBeVisible();
    await userEvent.click(page.getByRole('link', { name: 'My classes', exact: true }));
  }
  finishSave();
  if (order === 'after') {
    await expect.element(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
    await userEvent.click(page.getByRole('link', { name: 'My classes', exact: true }));
  }
  await expect.element(page.getByRole('heading', { name: 'My classes', exact: true })).toBeVisible();
  if (order === 'after') {
    finishCreate();
  }
  await expect.poll(() => deleteClassDraft).toHaveBeenCalledWith(14);
  const reads = vi.mocked(listClassDrafts).mock.calls.length;
  finishDelete();
  await expect.poll(() => vi.mocked(listClassDrafts).mock.calls.length).toBeGreaterThan(reads);
  await expect.element(page.getByRole('link', { name: 'Resume', exact: true })).not.toBeInTheDocument();
});
