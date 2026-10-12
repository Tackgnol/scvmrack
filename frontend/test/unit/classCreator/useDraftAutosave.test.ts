import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassDraft, StoredClassDraft } from '@/api/classes';

const api = vi.hoisted(() => ({
  createClassDraft: vi.fn(),
  updateClassDraft: vi.fn(),
  deleteClassDraft: vi.fn(),
  getClassDraft: vi.fn(),
}));
vi.mock('@/api/classes', () => api);

import { useDraftAutosave } from '@/components/organisms/class-creator/ClassCreator/useDraftAutosave';

const draft = { name: { en: 'Gutter Prophet', pl: '' } } as unknown as ClassDraft;
const stored = (id: number): StoredClassDraft =>
  ({ id, classId: 7, draft, revision: 1, updatedAt: '2026-10-12T00:00:00.000Z' }) as StoredClassDraft;

describe('useDraftAutosave after the class is saved', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    api.deleteClassDraft.mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('writes each edit once instead of re-saving after every save', async () => {
    let serverRevision = 1;
    api.updateClassDraft.mockImplementation(async () => ({ ...stored(1), revision: ++serverRevision }));
    const replaceDraft = vi.fn();
    renderHook(() =>
      useDraftAutosave({ classId: 7, draft, revision: 2, initialDraft: stored(1), replaceDraft })
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
      useDraftAutosave({ classId: 7, draft, revision: 2, initialDraft: stored(1), replaceDraft })
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
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: { ...stored(5), classId: null }, replaceDraft: vi.fn() })
    );

    await expect(act(async () => result.current.discard())).rejects.toThrow('Offline');

    expect(result.current.record?.id).toBe(5);
    expect(localStorage.getItem('scvmrack:class-draft:new')).not.toBeNull();
  });

  it('removes a save that finishes while discard is in flight', async () => {
    let finishSave: (record: StoredClassDraft) => void = () => undefined;
    api.createClassDraft.mockImplementation(() => new Promise<StoredClassDraft>((resolve) => { finishSave = resolve; }));
    const { result, unmount } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: null, replaceDraft: vi.fn() })
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => {
      const discarded = result.current.discard();
      finishSave({ ...stored(5), classId: null });
      await discarded;
    });
    unmount();

    expect(api.deleteClassDraft).toHaveBeenCalledWith(5);
    expect(localStorage.getItem('scvmrack:class-draft:new')).toBeNull();
  });

  it('keeps an in-flight saved draft available when deletion fails, then retries', async () => {
    let finishSave: (record: StoredClassDraft) => void = () => undefined;
    api.createClassDraft.mockImplementation(() => new Promise<StoredClassDraft>((resolve) => { finishSave = resolve; }));
    api.deleteClassDraft.mockRejectedValueOnce(new Error('Offline'));
    const { result } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: null, replaceDraft: vi.fn() })
    );

    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => {
      const discarded = result.current.discard();
      finishSave({ ...stored(5), classId: null });
      await expect(discarded).rejects.toThrow('Offline');
    });
    expect(result.current.record?.id).toBe(5);
    expect(localStorage.getItem('scvmrack:class-draft:new')).not.toBeNull();

    await act(async () => { await result.current.discard(); });
    expect(api.deleteClassDraft).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('scvmrack:class-draft:new')).toBeNull();
  });

  it('autosaves a new edit after discard', async () => {
    const { result, rerender } = renderHook(({ revision }) =>
      useDraftAutosave({ classId: null, draft, revision, initialDraft: { ...stored(5), classId: null }, replaceDraft: vi.fn() }),
      { initialProps: { revision: 2 } }
    );
    api.createClassDraft.mockResolvedValue({ ...stored(6), classId: null });

    await act(async () => { await result.current.discard(); });
    rerender({ revision: 3 });
    await act(async () => { vi.advanceTimersByTime(1_000); });

    expect(api.createClassDraft).toHaveBeenCalledTimes(1);
  });

  it('does not restore a discarded draft from local storage or the unmount flush', async () => {
    const record = { ...stored(5), classId: null };
    const { result, unmount } = renderHook(() =>
      useDraftAutosave({ classId: null, draft, revision: 2, initialDraft: record, replaceDraft: vi.fn() })
    );

    await act(async () => { await result.current.discard(); });
    await act(async () => { vi.advanceTimersByTime(10_000); });
    unmount();
    await act(async () => { vi.advanceTimersByTime(10_000); });

    expect(api.deleteClassDraft).toHaveBeenCalledWith(5);
    expect(localStorage.getItem('scvmrack:class-draft:new')).toBeNull();
    expect(api.createClassDraft).not.toHaveBeenCalled();
    expect(api.updateClassDraft).not.toHaveBeenCalled();
  });
});
