import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { expect, it } from 'vitest';
import CharacterClassSummary from '@/components/molecules/character/CharacterClassSummary';
import BrowserTestProvider from '../BrowserTestProvider';

it.each([
  ['Ash Cartographer', '/classes/17'],
  ['Report a class', '/report'],
])('keeps %s navigation in the main router', async (label, pathname) => {
  const root = createRootRoute({ component: Outlet });
  const sheet = createRoute({ getParentRoute: () => root, path: '/', component: () => (
    <CharacterClassSummary label="Class" className="Ash Cartographer" detailClassId={17} reportClassId={17} />
  ) });
  const detail = createRoute({ getParentRoute: () => root, path: '/classes/$classId', component: () => {
    const { classId } = detail.useParams();
    return <h1>Class {classId}</h1>;
  } });
  const report = createRoute({ getParentRoute: () => root, path: '/report',
    validateSearch: (search: Record<string, unknown>) => ({ classId: String(search.classId ?? '') }),
    component: () => {
      const { classId } = report.useSearch();
      return <h1>Report {classId}</h1>;
    },
  });
  const router = createRouter({ routeTree: root.addChildren([sheet, detail, report]), history: createMemoryHistory({ initialEntries: ['/'] }) });
  await render(<BrowserTestProvider><RouterProvider router={router} /></BrowserTestProvider>);
  await userEvent.click(page.getByRole('link', { name: label, exact: true }));
  await expect.element(page.getByRole('heading', { name: pathname === '/report' ? 'Report 17' : 'Class 17' })).toBeVisible();
  expect(router.state.location.pathname).toBe(pathname);
});
