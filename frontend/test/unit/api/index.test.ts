import { describe, it, expect } from 'vitest';
import { isAuthPath, authKeys, characterKeys } from '../../../src/api/index';

// We don't necessarily need to test the full client integration here as it involves many mocks,
// but we can test the exported logic.

describe('api utils', () => {
  describe('isAuthPath', () => {
    it('should return true for auth paths', () => {
      expect(isAuthPath('/api/auth/login')).toBe(true);
      expect(isAuthPath('/api/auth/oauth2/login/logto')).toBe(true);
    });

    it('should return false for non-auth paths', () => {
      expect(isAuthPath('/characters')).toBe(false);
      expect(isAuthPath('/equipment')).toBe(false);
      expect(isAuthPath('/')).toBe(false);
    });
  });

  describe('authKeys', () => {
    it('should return correct query keys', () => {
      expect(authKeys.all).toEqual(['auth']);
      expect(authKeys.session()).toEqual(['auth', 'session']);
      expect(authKeys.me()).toEqual(['auth', 'me']);
    });
  });

  describe('characterKeys', () => {
    it('should return correct query keys', () => {
      expect(characterKeys.all).toEqual(['characters']);
      expect(characterKeys.list()).toEqual(['characters', 'list']);
      expect(characterKeys.detail('123')).toEqual(['characters', '123', undefined]);
      expect(characterKeys.detail('123', 'pl')).toEqual(['characters', '123', 'pl']);
    });
  });
});
