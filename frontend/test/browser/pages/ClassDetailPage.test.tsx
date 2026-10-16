import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrowserTestProvider from '../BrowserTestProvider';
import { ClassDetailPage } from '@/pages/ClassDetailPage';
import { getClassDetail } from '@/api/classes';
import { blankDraft } from '@/components/organisms/class-creator/creatorShared.utils';
import i18n, { loadLanguage } from '@/i18n';

vi.mock('@/seo/Seo', () => ({ Seo: () => null }));
vi.mock('@tanstack/react-router', () => ({ useParams: () => ({ classId: '7' }), Link: () => null }));
vi.mock('@/api/classes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/classes')>()),
  getClassDetail: vi.fn(),
}));

describe('ClassDetailPage', () => {
  it('asks for the class credit in the reader language and refetches it on a switch (RPG-319)', async () => {
    const draft = { ...blankDraft(), name: { en: 'Bog Witch', pl: 'Wiedźma z bagien' } };
    vi.mocked(getClassDetail).mockImplementation(async (_id, locale) => ({
      draft,
      attribution: locale === 'pl' ? 'stworzona przez Ada' : 'created by Ada',
      reportable: false,
    }) as never);
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');
    try {
      await render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <BrowserTestProvider><ClassDetailPage /></BrowserTestProvider>
        </QueryClientProvider>,
      );

      await expect.element(page.getByText('stworzona przez Ada', { exact: true })).toBeVisible();
      expect(getClassDetail).toHaveBeenCalledWith(7, 'pl');

      await i18n.changeLanguage('en');
      await expect.element(page.getByText('created by Ada', { exact: true })).toBeVisible();
      expect(getClassDetail).toHaveBeenLastCalledWith(7, 'en');
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});
