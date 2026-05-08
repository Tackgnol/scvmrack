import { describe, it, expect } from 'vitest';
import { formatDice } from '../../../src/components/equipped/formatDice';

describe('formatDice', () => {
  it('should return empty string for empty input', () => {
    expect(formatDice([])).toBe('');
    expect(formatDice(undefined)).toBe('');
  });

  it('should format single die', () => {
    expect(formatDice([4])).toBe('d4');
    expect(formatDice([6])).toBe('d6');
  });

  it('should format multiple identical dice', () => {
    expect(formatDice([6, 6])).toBe('2d6');
    expect(formatDice([8, 8, 8])).toBe('3d8');
  });

  it('should format multiple different dice', () => {
    expect(formatDice([6, 4])).toBe('d4 + d6');
    expect(formatDice([6, 6, 4])).toBe('d4 + 2d6');
  });
});
