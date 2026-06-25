import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCharacterDraft, DRAFT_STORAGE_KEY } from '@/hooks/useCharacterDraft';
import * as draftApi from '@/api/draft';

vi.mock('@/api/draft', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/draft')>();
  return {
    ...original,
    createDraft: vi.fn(),
    rerollDraftSection: vi.fn(),
    confirmDraft: vi.fn(),
  };
});

const seeds = Object.fromEntries(
  ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality']
    .map((section) => [section, 'a'.repeat(64)])
) as draftApi.SectionSeeds;

const draft: draftApi.CharacterDraft = { classId: 1, classless: false, seeds };
const classlessDraft: draftApi.CharacterDraft = {
  classId: null,
  classless: true,
  dropLowestAbilities: ['strength'],
  seeds,
};
const classlessStatOptions: draftApi.ClasslessStatOption[] = [
  { ability: 'strength', dice: [6, 6, 1, 1], minTotal: 8, maxTotal: 13, selected: true },
  { ability: 'agility', dice: [2, 2, 2, 2], minTotal: 6, maxTotal: 6, selected: false },
  { ability: 'presence', dice: [6, 5, 4, 3], minTotal: 12, maxTotal: 15, selected: false },
  { ability: 'toughness', dice: [1, 2, 3, 4], minTotal: 6, maxTotal: 9, selected: false },
];
const preview = { id: undefined, name: 'Brint', presence: 12 };

describe('useCharacterDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(draftApi.createDraft).mockResolvedValue({ draft, preview });
    vi.mocked(draftApi.rerollDraftSection).mockResolvedValue({
      draft: { ...draft, seeds: { ...seeds, stats: 'b'.repeat(64) } },
      preview,
    });
    vi.mocked(draftApi.confirmDraft).mockResolvedValue({ id: 'char-9' });
  });

  it('starts in the class-gate phase with no draft', () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    expect(result.current.phase).toBe('class-gate');
    expect(result.current.draft).toBeNull();
  });

  it('start() rolls a draft, moves to sheet phase, and persists to sessionStorage', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    expect(draftApi.createDraft).toHaveBeenCalledWith({ classId: 1 }, 'en', expect.anything());
    expect(result.current.phase).toBe('sheet');
    expect(result.current.preview).toEqual(preview);
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)!)).toEqual(draft);
  });

  it('rehydrates a stored draft on mount via createDraft with stored seeds', async () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    const { result } = renderHook(() => useCharacterDraft('en'));

    await waitFor(() => expect(result.current.phase).toBe('sheet'));
    expect(draftApi.createDraft).toHaveBeenCalledWith(
      { classId: 1, classless: false, seeds },
      'en',
      expect.anything(),
    );
  });

  it('rehydrates a stored draft name with the stored seeds', async () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, name: 'Rotmaw' }));
    const { result } = renderHook(() => useCharacterDraft('en'));

    await waitFor(() => expect(result.current.phase).toBe('sheet'));
    expect(draftApi.createDraft).toHaveBeenCalledWith(
      { classId: 1, classless: false, name: 'Rotmaw', seeds },
      'en',
      expect.anything(),
    );
  });

  it('clears a corrupt stored draft and stays on the class gate', () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, '{not json');
    const { result } = renderHook(() => useCharacterDraft('en'));

    expect(result.current.phase).toBe('class-gate');
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('reroll() marks only the affected section busy and updates the stored draft', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.reroll('stats');
    });
    expect(result.current.rollingSection).toBe('stats');
    await act(() => pending);

    expect(result.current.rollingSection).toBeNull();
    expect(draftApi.rerollDraftSection).toHaveBeenCalledWith(draft, 'stats', 'en', expect.anything());
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)!).seeds.stats).toBe('b'.repeat(64));
  });

  it('reroll(name) drops a typed name override before asking the server', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));
    act(() => result.current.setName('Rotmaw'));

    await act(() => result.current.reroll('name'));

    expect(draftApi.rerollDraftSection).toHaveBeenCalledWith(
      { classId: 1, classless: false, seeds },
      'name',
      'en',
      expect.anything(),
    );
  });

  it('reroll(name) preserves classless stat choices', async () => {
    vi.mocked(draftApi.createDraft).mockResolvedValueOnce({
      draft: classlessDraft,
      preview,
      classlessStatOptions,
    });
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classless: true, dropLowestAbilities: ['strength'] }));

    await act(() => result.current.reroll('name'));

    expect(draftApi.rerollDraftSection).toHaveBeenCalledWith(
      { classId: null, classless: true, dropLowestAbilities: ['strength'], seeds },
      'name',
      'en',
      expect.anything(),
    );
  });

  it('setDropLowestAbilities() updates a classless draft without marking stats as rolling', async () => {
    const nextDraft: draftApi.CharacterDraft = {
      ...classlessDraft,
      dropLowestAbilities: ['strength', 'presence'],
    };
    let resolveChoice!: (value: draftApi.DraftResponse) => void;
    vi.mocked(draftApi.createDraft)
      .mockResolvedValueOnce({ draft: classlessDraft, preview, classlessStatOptions })
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveChoice = resolve;
        }),
      );

    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classless: true, dropLowestAbilities: ['strength'] }));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.setDropLowestAbilities(['strength', 'presence']);
    });
    expect(result.current.isChoosingStats).toBe(true);
    expect(result.current.rollingSection).toBeNull();
    expect(draftApi.createDraft).toHaveBeenLastCalledWith(nextDraft, 'en', expect.anything());

    resolveChoice({ draft: nextDraft, preview, classlessStatOptions });
    await act(() => pending);

    expect(result.current.isChoosingStats).toBe(false);
    expect(result.current.draft).toEqual(nextDraft);
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)!)).toEqual(nextDraft);
  });

  it('ignores reroll() while another reroll is in flight', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    let resolveFirst!: (value: draftApi.DraftResponse) => void;
    vi.mocked(draftApi.rerollDraftSection).mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );

    let first!: Promise<void>;
    act(() => {
      first = result.current.reroll('gear');
    });
    act(() => {
      void result.current.reroll('stats');
    });
    expect(draftApi.rerollDraftSection).toHaveBeenCalledTimes(1);

    resolveFirst({ draft, preview });
    await act(() => first);
  });

  it('confirm() creates the character, clears storage, and reports the created character', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useCharacterDraft('en', { onCreated }));
    await act(() => result.current.start({ classId: 1 }));
    await act(() => result.current.confirm());

    expect(draftApi.confirmDraft).toHaveBeenCalledWith(draft, 'en', expect.anything(), false);
    expect(onCreated).toHaveBeenCalledWith({ id: 'char-9' });
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('confirm(true) opts into replacing an existing scvm', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useCharacterDraft('en', { onCreated }));
    await act(() => result.current.start({ classId: 1 }));
    await act(() => result.current.confirm(true));

    expect(draftApi.confirmDraft).toHaveBeenCalledWith(draft, 'en', expect.anything(), true);
    expect(onCreated).toHaveBeenCalledWith({ id: 'char-9' });
  });

  it('setName() edits the preview, persists the draft override, and confirms it', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    act(() => result.current.setName('Rotmaw'));
    expect(result.current.preview?.name).toBe('Rotmaw');
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)!)).toEqual({
      ...draft,
      name: 'Rotmaw',
    });

    await act(() => result.current.confirm());
    expect(draftApi.confirmDraft).toHaveBeenCalledWith(
      { ...draft, name: 'Rotmaw' },
      'en',
      expect.anything(),
      false,
    );
  });

  it('surfaces errors and keeps the last good preview', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    vi.mocked(draftApi.rerollDraftSection).mockRejectedValueOnce(new Error('boom'));
    await act(() => result.current.reroll('gear'));

    expect(result.current.error).toBeTruthy();
    expect(result.current.preview).toEqual(preview);
    expect(result.current.phase).toBe('sheet');
  });

  it('restart() returns to the class gate and clears storage', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));
    act(() => result.current.restart());

    expect(result.current.phase).toBe('class-gate');
    expect(result.current.draft).toBeNull();
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
