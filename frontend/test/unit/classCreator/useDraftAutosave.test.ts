import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassDraft, StoredClassDraft } from '@/api/classes';

const api = vi.hoisted(() => ({
  createClassDraft: vi.fn(),
  updateClassDraft: vi.fn(),
  deleteClassDraft: vi.fn(),
  getClassDraft: vi.fn(),
}));
vi.mock('@/api/classes', async importOriginal => ({
  ...await importOriginal<typeof import('@/api/classes')>(),
  ...api,
}));

import { useDraftAutosave } from '@/components/organisms/class-creator/ClassCreator/useDraftAutosave';

const draft = { name: { en: 'Gutter Prophet', pl: '' } } as unknown as ClassDraft;
const stored = (id: number): StoredClassDraft =>
  ({ id, classId: 7, draft, revision: 1, updatedAt: '2026-10-12T00:00:00.000Z' }) as StoredClassDraft;

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}
beforeEach(() => queryClient.clear());

describe('useDraftAutosave after the class is saved', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    api.deleteClassDraft.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('writes each edit once instead of re-saving after every save', async () => {
    let serverRevision = 1;
    api.updateClassDraft.mockImplementation(async () => ({ ...stored(1), revision: ++serverRevision }));
    const replaceDraft = vi.fn();
    renderHook(() =>
      useDraftAutosave({ classId: 7, draft, revision: 2, initialDraft: stored(1), replaceDraft }),
      { wrapper },
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => { vi.advanceTimersByTime(10_000); });

    expect(api.updateClassDraft).toHaveBeenCalledTimes(1);
  });

  it('does not recreate a draft from an in-flight write or the unmount flush', async () => {
    let failWrite: (error: Error) => void = () => undefined;
    api.updateClassDraft.mockImplementation(
      () => new Promise<StoredClassDraft>((_resolve, reject) => { failWrite = reject; })
    );
    const replaceDraft = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDraftAutosave({ classId: 7, draft, revision: 2, initialDraft: stored(1), replaceDraft }),
      { wrapper },
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    expect(api.updateClassDraft).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.complete(); });
    // the save deleted the draft, so the pending write comes back as a 409
    await act(async () => { failWrite(new Error('Draft not found')); });
    unmount();
    await act(async () => { vi.advanceTimersByTime(10_000); });

    expect(api.createClassDraft).not.toHaveBeenCalled();
    expect(api.updateClassDraft).toHaveBeenCalledTimes(1);
  });

  it('keeps the draft when server deletion fails', async () => {
    api.deleteClassDraft.mockRejectedValueOnce(new Error('Offline'));
    const { result } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: { ...stored(5), classId: null }, replaceDraft: vi.fn() }),
      { wrapper },
    );

    await expect(act(async () => result.current.discard())).rejects.toThrow('Offline');

    expect(result.current.record?.id).toBe(5);
  });

  it('removes a save that finishes while discard is in flight', async () => {
    let finishSave: (record: StoredClassDraft) => void = () => undefined;
    api.createClassDraft.mockImplementation(() => new Promise<StoredClassDraft>((resolve) => { finishSave = resolve; }));
    const { result, unmount } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: null, replaceDraft: vi.fn() }),
      { wrapper },
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => {
      const discarded = result.current.discard();
      finishSave({ ...stored(5), classId: null });
      await discarded;
    });
    unmount();

    expect(api.deleteClassDraft).toHaveBeenCalledWith(5);
  });

  it('keeps an in-flight saved draft available when deletion fails, then retries', async () => {
    let finishSave: (record: StoredClassDraft) => void = () => undefined;
    api.createClassDraft.mockImplementation(() => new Promise<StoredClassDraft>((resolve) => { finishSave = resolve; }));
    api.deleteClassDraft.mockRejectedValueOnce(new Error('Offline'));
    const { result } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: null, replaceDraft: vi.fn() }),
      { wrapper },
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => {
      const discarded = result.current.discard();
      finishSave({ ...stored(5), classId: null });
      await expect(discarded).rejects.toThrow('Offline');
    });
    expect(result.current.record?.id).toBe(5);

    await act(async () => { await result.current.discard(); });
    expect(api.deleteClassDraft).toHaveBeenCalledTimes(2);
  });

  it('autosaves a new edit after discard', async () => {
    const { result, rerender } = renderHook(({ revision }) =>
      useDraftAutosave({ classId: null, draft, revision, initialDraft: { ...stored(5), classId: null }, replaceDraft: vi.fn() }),
      { initialProps: { revision: 2 }, wrapper }
    );
    api.createClassDraft.mockResolvedValue({ ...stored(6), classId: null });

    await act(async () => { await result.current.discard(); });
    rerender({ revision: 3 });
    await act(async () => { vi.advanceTimersByTime(1_000); });

    expect(api.createClassDraft).toHaveBeenCalledTimes(1);
  });

  it('does not resave a discarded draft from the unmount flush', async () => {
    const record = { ...stored(5), classId: null };
    const { result, unmount } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: record, replaceDraft: vi.fn() }),
      { wrapper },
    );

    await act(async () => { await result.current.discard(); });
    await act(async () => { vi.advanceTimersByTime(10_000); });
    unmount();
    await act(async () => { vi.advanceTimersByTime(10_000); });

    expect(api.deleteClassDraft).toHaveBeenCalledWith(5);
    expect(api.createClassDraft).not.toHaveBeenCalled();
    expect(api.updateClassDraft).not.toHaveBeenCalled();
  });
});

describe('useDraftAutosave completing a save', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    api.deleteClassDraft.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('leaves the draft the server discarded alone and deletes one the save did not name', () => {
    const named = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 1, initialDraft: { ...stored(5), classId: null }, replaceDraft: vi.fn() }),
      { wrapper },
    );
    act(() => named.result.current.complete(5));
    expect(api.deleteClassDraft).not.toHaveBeenCalled();

    const unnamed = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 1, initialDraft: { ...stored(6), classId: null }, replaceDraft: vi.fn() }),
      { wrapper },
    );
    act(() => unnamed.result.current.complete(undefined));
    expect(api.deleteClassDraft).toHaveBeenCalledWith(6);
  });
});

describe('useDraftAutosave keeps unsaved edits across a session expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  const edited = { name: { en: 'Gutter Prophet, edited', pl: '' } } as unknown as ClassDraft;
  const unauthorized = Object.assign(new Error('Your session expired'), { statusCode: 401, code: 'UNAUTHORIZED' });

  it('keeps the refused edit in the browser and clears it once a save lands', async () => {
    api.updateClassDraft.mockRejectedValueOnce(unauthorized);
    const replaceDraft = vi.fn();
    const { result, rerender } = renderHook(
      ({ revision }) => useDraftAutosave({ classId: 7, draft: edited, revision, initialDraft: stored(1), replaceDraft }),
      { wrapper, initialProps: { revision: 2 } },
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    expect(result.current.state).toBe('unsaved');
    expect(JSON.parse(localStorage.getItem('scvmrack-class-draft-unsaved-v1:1') ?? 'null')).toEqual({
      baseRevision: 1,
      draft: edited,
    });

    api.updateClassDraft.mockResolvedValueOnce({ ...stored(1), draft: edited, revision: 2 });
    rerender({ revision: 3 });
    await act(async () => { vi.advanceTimersByTime(1_000); });

    expect(result.current.state).toBe('saved');
    expect(localStorage.getItem('scvmrack-class-draft-unsaved-v1:1')).toBeNull();
  });
});
