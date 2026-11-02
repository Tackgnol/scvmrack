import { expect, it } from 'vitest';
import { ABILITY_STATS, ABILITY_SCORE_LIMITS } from '@/utils/stats';
import { characterUpdateSchema, sanitizeSimpleFieldValue } from '@/validation/characterUpdate';

it.each(ABILITY_STATS)('%s uses the same bound in field edits and PATCH validation', stat => {
  expect(characterUpdateSchema.parse({ [stat]: 30 })[stat]).toBe(ABILITY_SCORE_LIMITS.max);
  expect(sanitizeSimpleFieldValue(stat, 30)).toBe(ABILITY_SCORE_LIMITS.max);
});
