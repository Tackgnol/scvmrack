import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as creator from '@/components/organisms/class-creator/creatorShared.utils';
import { LIMIT_LIST, LIMIT_NAME, LIMIT_TEXT } from '@/components/organisms/class-creator/creatorShared.utils';
import { DIE_FACES } from '@/utils/rollDie';

// The creator mirrors the server's draft limits so it can warn as the GM types; the server enforces them.
const backendDraft = readFileSync(resolve(__dirname, '../../../../backend/src/lib/class-draft.ts'), 'utf8');
const backendValue = (name: string) => {
  const match = new RegExp(`export const ${name} = ([^;]+?)(?: as const)?;`).exec(backendDraft);
  if (!match) {
    throw new Error(`${name} not found in backend/src/lib/class-draft.ts`);
  }
  return JSON.parse(match[1]) as unknown;
};

describe('the creator mirrors the server draft rules', () => {
  it('uses the same limits', () => {
    expect({ LIMIT_LIST, LIMIT_TEXT, LIMIT_NAME }).toEqual({
      LIMIT_LIST: backendValue('LIMIT_LIST'),
      LIMIT_TEXT: backendValue('LIMIT_TEXT'),
      LIMIT_NAME: backendValue('LIMIT_NAME'),
    });
  });

  it('offers the dice the server accepts', () => {
    expect([...DIE_FACES]).toEqual(backendValue('DIE_FACES'));
    for (const name of ['STAT_DIE_FACES', 'TABLE_DICE', 'OMEN_DICE', 'WEAPON_DICE', 'ARMOR_DICE', 'SILVER_DICE', 'PET_ACTION_DICE', 'ARMOR_TIERS'] as const) {
      expect([...creator[name]], name).toEqual(backendValue(name));
    }
  });
});
