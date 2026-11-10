import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  characterDetailKey,
  characterRosterKey,
  ownedCharactersKey,
  readCharacter,
} from '@/api/characterCache';
import type { ImprovementDraft, ImprovementPreview } from '@/api/characterImprovementTypes';
import { useGettingBetterPreview } from '@/hooks/useGettingBetterPreview';

const apiMocks = vi.hoisted(() => ({
  getOrCreateImprovementPreview: vi.fn(),
  rerollImprovementSection: vi.fn(),
  applyImprovement: vi.fn(),
}));

const snackbarMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const cache = vi.hoisted(() => ({ queryClient: undefined as unknown as QueryClient }));
const apiListKey = [...characterRosterKey(), { params: { query: { locale: 'pl' } } }];

vi.mock('@/api/characterImprovement', () => ({
  getOrCreateImprovementPreview: apiMocks.getOrCreateImprovementPreview,
  rerollImprovementSection: apiMocks.rerollImprovementSection,
  applyImprovement: apiMocks.applyImprovement,
}));

vi.mock('@/SnackbarContext/SnackbarProvider', () => ({
  useSnackbar: () => snackbarMocks,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, values?: Record<string, unknown>) => {
      if (!fallback) {
        return key;
      }
      return fallback.replace(/\{\{(\w+)}}/g, (_match, token) =>
        String(values?.[token] ?? '')
      );
    },
  }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => cache.queryClient,
  useMutation: (options: {
    mutationFn: (variables?: unknown) => Promise<unknown>;
    onSuccess?: (value: unknown, variables?: unknown) => void;
    onError?: (error: unknown, variables?: unknown) => void;
  }) => ({
    isPending: false,
    mutate: (variables?: unknown) => {
      Promise.resolve()
        .then(() => options.mutationFn(variables))
        .then((value) => options.onSuccess?.(value, variables))
        .catch((error) => options.onError?.(error, variables));
    },
  }),
}));

function abilityRoll(fromScore = 9) {
  return {
    roll: { source: 'server' as const, total: 2 },
    fromScore,
    fromModifier: 0,
    toModifier: 1,
    toScore: 13,
    outcome: 'increase' as const,
  };
}

function draft(overrides: Partial<ImprovementDraft> = {}): ImprovementDraft {
  return {
    sequence: 1,
    snapshot: {
      characterUpdatedAt: '2026-07-07T10:00:00.000Z',
      maxHp: 10,
      silver: 5,
      abilities: {
        strength: 9,
        agility: 9,
        presence: 9,
        toughness: 9,
      },
      abilityKeys: [],
      equipmentFingerprint: 'empty',
      snapshotHash: 'snapshot-hash',
    },
    hp: {
      check: { source: 'server', total: 12 },
      fromMaxHp: 10,
      succeeds: true,
      increase: { source: 'server', total: 4 },
      toMaxHp: 14,
    },
    debris: {
      roll: { source: 'server', total: 1 },
      kind: 'nothing',
    },
    abilities: {
      strength: abilityRoll(),
      agility: abilityRoll(),
      presence: abilityRoll(),
      toughness: abilityRoll(),
    },
    classAbility: { kind: 'none' },
    ...overrides,
  };
}

function preview(overrides: Partial<ImprovementPreview> = {}): ImprovementPreview {
  const rolledDraft = overrides.rolledDraft ?? draft();
  return {
    id: 'improvement-1',
    characterId: 'char-1',
    sequence: rolledDraft.sequence,
    rolledDraft,
    abilityNames: {},
    rulesNote: null,
    scrollNames: {},
    snapshotHash: rolledDraft.snapshot.snapshotHash,
    createdAt: '2026-07-07T10:00:00.000Z',
    updatedAt: '2026-07-07T10:00:00.000Z',
    ...overrides,
  };
}

describe('useGettingBetterPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.queryClient = new QueryClient();
    cache.queryClient.setQueryData(ownedCharactersKey, []);
    cache.queryClient.setQueryData(apiListKey, []);
    apiMocks.getOrCreateImprovementPreview.mockResolvedValue(preview());
    apiMocks.rerollImprovementSection.mockResolvedValue(preview());
    apiMocks.applyImprovement.mockResolvedValue({ id: 'char-1', name: 'Ash' });
  });

  test('opens a preview, tracks local edits, and undoes them', async () => {
    const { result } = renderHook(() =>
      useGettingBetterPreview({ characterId: 'char-1', locale: 'pl' })
    );

    act(() => result.current.open());

    await waitFor(() => expect(result.current.workingDraft).not.toBeNull());
    expect(apiMocks.getOrCreateImprovementPreview).toHaveBeenCalledWith('char-1', 'pl');
    expect(result.current.isOpen).toBe(true);
    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setWorkingDraft((current) =>
        current
          ? {
              ...current,
              hp: {
                ...current.hp,
                check: { source: 'table', total: 11 },
              },
            }
          : current
      );
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtySections.hp).toBe(true);

    act(() => result.current.undoEdits());

    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtySections.hp).toBe(false);
  });

  test('normalizes a regional browser locale before requesting a preview', async () => {
    apiMocks.getOrCreateImprovementPreview.mockImplementation(
      async (_characterId: string, locale?: string) => {
        if (locale !== 'en' && locale !== 'pl') {
          throw new Error('INVALID QUERYSTRING');
        }
        return preview();
      }
    );
    const { result } = renderHook(() =>
      useGettingBetterPreview({ characterId: 'char-1', locale: 'en-US' })
    );

    act(() => result.current.open());

    await waitFor(() => expect(result.current.workingDraft).not.toBeNull());
    expect(apiMocks.getOrCreateImprovementPreview).toHaveBeenCalledWith('char-1', 'en');
    expect(snackbarMocks.showError).not.toHaveBeenCalled();
  });

  test('rerolling one section preserves unrelated local table edits', async () => {
    const originalPreview = preview();
    const rerolledPreview = preview({
      rolledDraft: draft({
        hp: {
          check: { source: 'server', total: 20 },
          fromMaxHp: 10,
          succeeds: true,
          increase: { source: 'server', total: 5 },
          toMaxHp: 15,
        },
      }),
    });
    apiMocks.getOrCreateImprovementPreview.mockResolvedValue(originalPreview);
    apiMocks.rerollImprovementSection.mockResolvedValue(rerolledPreview);
    const { result } = renderHook(() =>
      useGettingBetterPreview({ characterId: 'char-1', locale: 'en' })
    );

    act(() => result.current.open());
    await waitFor(() => expect(result.current.workingDraft).not.toBeNull());
    act(() => {
      result.current.setWorkingDraft((current) =>
        current
          ? {
              ...current,
              debris: {
                roll: { source: 'table', total: 4 },
                kind: 'silver',
                silver: { source: 'table', total: 17 },
                amount: 17,
              },
            }
          : current
      );
    });

    act(() => result.current.rerollSection('hp'));

    await waitFor(() =>
      expect(result.current.workingDraft?.hp.check.total).toBe(20)
    );
    expect(apiMocks.rerollImprovementSection).toHaveBeenCalledWith({
      characterId: 'char-1',
      improvementId: 'improvement-1',
      section: 'hp',
      locale: 'en',
    });
    expect(result.current.workingDraft?.debris).toEqual({
      roll: { source: 'table', total: 4 },
      kind: 'silver',
      silver: { source: 'table', total: 17 },
      amount: 17,
    });
  });

  test('dirty close asks before discarding local values', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() =>
      useGettingBetterPreview({ characterId: 'char-1', locale: 'en' })
    );

    act(() => result.current.open());
    await waitFor(() => expect(result.current.workingDraft).not.toBeNull());
    act(() => {
      result.current.setWorkingDraft((current) =>
        current
          ? {
              ...current,
              hp: {
                ...current.hp,
                check: { source: 'table', total: 11 },
              },
            }
          : current
      );
    });

    let closed = true;
    act(() => {
      closed = result.current.close();
    });

    expect(closed).toBe(false);
    expect(result.current.isOpen).toBe(true);

    confirm.mockReturnValue(true);
    act(() => {
      closed = result.current.close();
    });

    expect(closed).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  test('apply sends the locale, refreshes character cache, and closes', async () => {
    const { result } = renderHook(() =>
      useGettingBetterPreview({ characterId: 'char-1', locale: 'pl' })
    );

    act(() => result.current.open());
    await waitFor(() => expect(result.current.workingDraft).not.toBeNull());
    act(() => result.current.apply());

    await waitFor(() => expect(apiMocks.applyImprovement).toHaveBeenCalled());
    expect(apiMocks.applyImprovement).toHaveBeenCalledWith({
      characterId: 'char-1',
      improvementId: 'improvement-1',
      draft: result.current.preview?.rolledDraft ?? expect.any(Object),
      locale: 'pl',
    });
    await waitFor(() => expect(result.current.isOpen).toBe(false));
    const isStale = (key: readonly unknown[]) =>
      cache.queryClient.getQueryState(key)?.isInvalidated;
    expect(readCharacter(cache.queryClient, 'char-1', 'pl')).toEqual({ id: 'char-1', name: 'Ash' });
    expect(isStale(characterDetailKey('char-1', 'pl'))).toBe(false);
    expect(isStale(ownedCharactersKey)).toBe(true);
    expect(isStale(apiListKey)).toBe(true);
    expect(snackbarMocks.showSuccess).toHaveBeenCalledWith('Getting better applied');
  });

  test('apply conflict exposes stale state', async () => {
    apiMocks.applyImprovement.mockRejectedValue({
      status: 409,
      message: 'The character changed after this preview was rolled',
    });
    const { result } = renderHook(() =>
      useGettingBetterPreview({ characterId: 'char-1', locale: 'en' })
    );

    act(() => result.current.open());
    await waitFor(() => expect(result.current.workingDraft).not.toBeNull());
    act(() => result.current.apply());

    await waitFor(() => expect(result.current.staleConflict).toBe(true));
    expect(snackbarMocks.showError).toHaveBeenCalledWith(
      'The character changed after this preview was rolled'
    );
  });
});
