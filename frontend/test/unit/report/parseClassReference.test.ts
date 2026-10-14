import { describe, expect, it } from 'vitest';
import { parseClassReference } from '@/components/organisms/report/ReportForm/ReportForm.utils';

describe('parseClassReference', () => {
  it('reads a bare number or a pasted class link', () => {
    expect(parseClassReference(' 12 ')).toBe(12);
    expect(parseClassReference('https://scvmrack.rpgtools.co/classes/12')).toBe(12);
    expect(parseClassReference('/report?classId=7')).toBe(7);
  });

  it('rejects text with no class id in it', () => {
    expect(parseClassReference('')).toBeNull();
    expect(parseClassReference('Bog Witch')).toBeNull();
    expect(parseClassReference('0')).toBeNull();
  });
});
