import { describe, it, expect } from 'vitest';
import {
  includesToExclude,
  excludeToIncludes,
  resolveScopeFromIncludes,
  createModifierId,
  getModifierTileSpan,
} from '../../../src/components/modifiers/utils';
import { ALL_CONTEXTS } from '../../../src/components/modifiers/config';

describe('modifiers utils', () => {
  describe('includesToExclude', () => {
    it('should return contexts not included in the input', () => {
      const includes = ['melee', 'ranged'] as any;
      const result = includesToExclude(includes);
      expect(result).toEqual(ALL_CONTEXTS.filter(c => !includes.includes(c)));
    });

    it('should return all contexts if input is empty', () => {
      expect(includesToExclude([])).toEqual(ALL_CONTEXTS);
    });
  });

  describe('excludeToIncludes', () => {
    it('should return contexts not excluded in the input', () => {
      const exclude = ['melee', 'ranged'];
      const result = excludeToIncludes(exclude);
      expect(result).toEqual(ALL_CONTEXTS.filter(c => !exclude.includes(c)));
    });
  });

  describe('resolveScopeFromIncludes', () => {
    it('should return "all" for all contexts', () => {
      expect(resolveScopeFromIncludes([...ALL_CONTEXTS])).toBe('all');
    });

    it('should return "combat" for combat contexts', () => {
      expect(resolveScopeFromIncludes(['melee', 'ranged', 'cast'] as any)).toBe('combat');
    });

    it('should return "all" for unknown combination', () => {
      expect(resolveScopeFromIncludes(['melee'] as any)).toBe('melee');
      expect(resolveScopeFromIncludes(['melee', 'defence'] as any)).toBe('all');
    });
  });

  describe('createModifierId', () => {
    it('should create a unique string', () => {
      const id1 = createModifierId();
      const id2 = createModifierId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('getModifierTileSpan', () => {
    it('should return short span for short names', () => {
      expect(getModifierTileSpan(10)).toEqual({ col: 2, row: 1, full: false });
    });

    it('should return medium span for medium names', () => {
      expect(getModifierTileSpan(20)).toEqual({ col: 3, row: 1, full: false });
    });

    it('should return full span for long names', () => {
      expect(getModifierTileSpan(40)).toEqual({ col: 6, row: 2, full: true });
    });
  });
});
