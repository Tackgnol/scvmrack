import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { CharacterContext, useCharacter } from '@/CharacterContext/CharacterContext';

// CharacterContext.tsx imports useCurrentCharacter at the module level.
// Mock it so the import doesn't pull in TanStack Query in JSDOM.
vi.mock('@/hooks/useCurrentCharacter', () => ({
  useCurrentCharacter: vi.fn().mockReturnValue({ character: null, isLoading: false }),
}));

describe('useCharacter', () => {
  it('returns the context value when inside CharacterContext.Provider', () => {
    const mockValue = {
      character: { id: 'test-char', name: 'Scvm' },
      isLoading: false,
      updateField: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CharacterContext.Provider, { value: mockValue as any }, children);

    const { result } = renderHook(() => useCharacter(), { wrapper });

    expect(result.current.character?.id).toBe('test-char');
    expect(result.current.isLoading).toBe(false);
  });
});
