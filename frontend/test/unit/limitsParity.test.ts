import { expect, it } from 'vitest';
import { ABILITY_SCORE_LIMITS } from '@/utils/stats';
import { PARTY_NAME_MAX_LENGTH } from '@/validation/partyName';
import { ABILITY_SCORE_LIMITS as serverAbilityLimits } from '../../../backend/src/lib/character-limits';
import { PARTY_NAME_MAX_LENGTH as serverPartyNameLimit } from '../../../backend/src/config/party';

it('keeps client and server ability and party limits aligned', () => {
  expect(ABILITY_SCORE_LIMITS).toEqual(serverAbilityLimits);
  expect(PARTY_NAME_MAX_LENGTH).toBe(serverPartyNameLimit);
});
