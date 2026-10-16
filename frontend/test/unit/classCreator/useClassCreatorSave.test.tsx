import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

vi.mock('@/components/organisms/class-creator/ClassCreator/useDraftAutosave', () => ({
  useDraftAutosave: () => ({ complete: vi.fn(), discard: vi.fn(), persist: vi.fn(), record: { id: 5 } }),
}));
vi.mock('@/api/classes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/classes')>()),
  saveClass: vi.fn(),
}));

import { classKeys, saveClass } from '@/api/classes';
import { useClassCreator } from '@/components/organisms/class-creator/ClassCreator/useClassCreator';
import { blankDraft } from '@/components/organisms/class-creator/creatorShared.utils';

it('does not refetch the draft a save consumed (RPG-317)', async () => {
  const draft = {
    ...blankDraft(),
    name: { en: 'Bog Witch', pl: '' },
    description: { en: 'The mire keeps what you give it.', pl: '' },
    origins: [{ en: 'A drowned village', pl: '' }],
  };
  vi.mocked(saveClass).mockResolvedValue({ id: 9, draft, savedRefs: [] } as never);
  const queryClient = new QueryClient();
  queryClient.setQueryData(classKeys.draft(5), { id: 5 });
  queryClient.setQueryData(classKeys.drafts(), []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useClassCreator(null, draft), { wrapper });

  act(() => result.current.save());

  await waitFor(() => expect(result.current.saved).toBe(true));
  expect(queryClient.getQueryState(classKeys.draft(5))?.isInvalidated).toBe(false);
  expect(queryClient.getQueryState(classKeys.drafts())?.isInvalidated).toBe(true);
});
