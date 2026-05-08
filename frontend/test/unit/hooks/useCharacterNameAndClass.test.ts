import { renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useCharacterNameAndClass } from '../../../src/hooks/useCharacterNameAndClass.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

test('useCharacterNameAndClass exposes character flags and translated labels', () => {
  const wrapperState = createCharacterTestWrapper({
    character: {
      id: 'char-1',
      name: 'Test',
      className: 'Fanged Deserter',
    },
    isLoading: false,
  });

  const { result } = renderHook(() => useCharacterNameAndClass(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.hasCharacter).toBe(true);
  expect(result.current.character?.id).toBe('char-1');
  expect(result.current.noCharacterLoadedText).toBe('character.noCharacterLoaded');
  expect(result.current.nameLabel).toBe('character.name');
  expect(result.current.classLabel).toBe('character.class');
  expect(result.current.fallbackClassName).toBe('character.classless');
});

test('useCharacterNameAndClass reports hasCharacter=false when character is missing', () => {
  const wrapperState = createCharacterTestWrapper({
    character: undefined,
    isLoading: true,
  });

  const { result } = renderHook(() => useCharacterNameAndClass(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.hasCharacter).toBe(false);
  expect(result.current.isLoading).toBe(true);
});
