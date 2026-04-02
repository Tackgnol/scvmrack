import { describe, it, expect } from 'vitest';
import { formatActionDie } from '../../../src/components/pets/formatActionDie';

describe('formatActionDie', () => {
  it('should return "-" for empty input', () => {
    expect(formatActionDie([])).toBe('-');
    expect(formatActionDie(undefined)).toBe('-');
  });

  it('should return "-" for invalid input', () => {
    expect(formatActionDie([0, -1, NaN])).toBe('-');
  });

  it('should format single die', () => {
    expect(formatActionDie([6])).toBe('d6');
  });

  it('should format multiple dice', () => {
    expect(formatActionDie([6, 8])).toBe('d6 + d8');
  });

  it('should handle string numbers if passed (though type says number[])', () => {
    // @ts-ignore
    expect(formatActionDie(['4', 6])).toBe('d4 + d6');
  });
});
