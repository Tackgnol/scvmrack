import { expect, test } from 'vitest';
import { characterUpdateSchema } from '@/validation/characterUpdate';

test.each([['equipment', 50], ['storage', 100]] as const)('an over-cap %s patch is rejected instead of silently dropping items', (location, limit) => {
  const items = Array.from({ length: limit + 1 }, (_, i) => ({ key: `equipment.${i}`, name: `Item ${i}` }));
  const original = structuredClone(items);
  expect(characterUpdateSchema.safeParse({ [location]: items }).success).toBe(false);
  expect(items).toEqual(original);
  expect(characterUpdateSchema.parse({ [location]: items.slice(0, limit) })[location]).toHaveLength(limit);
});
