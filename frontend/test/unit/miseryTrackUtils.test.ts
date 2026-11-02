import { expect, it } from 'vitest';
import { getSelectedMiseryCount } from '@/components/molecules/character/miseryTrackUtils';

it('selects a count from a mixed state without treating it as zero', () => {
  expect(getSelectedMiseryCount(null, 0)).toBe(1);
  expect(getSelectedMiseryCount(null, 2)).toBe(3);
  expect(getSelectedMiseryCount(1, 0)).toBe(0);
});
