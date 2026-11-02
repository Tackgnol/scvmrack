import { expect, it } from 'vitest';
import { PARTY_NAME_MAX_LENGTH, partyNameSchema } from '@/validation/partyName';

it('accepts the name boundary and rejects overflow before trimming', () => {
  expect(partyNameSchema.safeParse('a'.repeat(PARTY_NAME_MAX_LENGTH)).success).toBe(true);
  expect(partyNameSchema.safeParse('a'.repeat(PARTY_NAME_MAX_LENGTH + 1)).success).toBe(false);
  expect(partyNameSchema.safeParse('a'.repeat(PARTY_NAME_MAX_LENGTH) + ' ').success).toBe(false);
});
