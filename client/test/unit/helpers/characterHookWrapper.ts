import React, { type ReactNode } from 'react';
import { CharacterContext } from '../../../src/CharacterContext/CharacterContext.tsx';
import { type useCurrentCharacter } from '../../../src/hooks/useCurrentCharacter.ts';

export type CharacterHookContext = ReturnType<typeof useCurrentCharacter>;

const BASE_CHARACTER_CONTEXT = {
  characterId: null,
  lastCharacterId: null,
  character: undefined,
  error: undefined,
  isLoading: false,
  locale: 'en',
  validationIssues: [],
  setValidationIssue: () => {},
  clearValidationIssue: () => {},
  clearValidationIssues: () => {},
  setCharacterId: () => {},
  changeLocale: async () => {},
  generateNew: () => {},
  killAndReplace: () => {},
  updateField: () => {},
  updateAbilities: () => {},
  addEquipmentItem: () => {},
  removeEquipmentItem: () => {},
  updateEquipmentItem: () => {},
  moveToStorage: () => {},
  addStorageItem: () => {},
  removeStorageItem: () => {},
  updateStorageItem: () => {},
  moveToEquipment: () => {},
  swapEquipmentStorage: () => {},
  toggleScrollUse: () => {},
  useAmmo: () => {},
  equipWeapon: () => {},
  unequipWeapon: () => {},
  equipArmor: () => {},
  unequipArmor: () => {},
  addModifier: () => {},
  removeModifier: () => {},
  updateModifier: () => {},
  isSaving: false,
  flush: () => {},
  flushUpdates: () => {},
  isAuthenticated: false,
  isGuest: true,
  claimCharacter: async () => {},
  isClaiming: false,
  isJustLoggedOut: false,
  isSessionExpired: false,
} as unknown as CharacterHookContext;

export function createCharacterTestContext(
  overrides: Partial<CharacterHookContext> = {}
): CharacterHookContext {
  return {
    ...BASE_CHARACTER_CONTEXT,
    ...overrides,
  } as CharacterHookContext;
}

export function createCharacterTestWrapper(
  initialOverrides: Partial<CharacterHookContext> = {}
) {
  let contextValue = createCharacterTestContext(initialOverrides);

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      CharacterContext.Provider,
      { value: contextValue },
      children
    );

  const setContext = (overrides: Partial<CharacterHookContext>) => {
    contextValue = createCharacterTestContext({
      ...contextValue,
      ...overrides,
    });
  };

  return {
    wrapper,
    setContext,
    getContext: () => contextValue,
  };
}
