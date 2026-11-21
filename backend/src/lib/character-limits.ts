export const MISERY_MIN = 0;
export const MISERY_MAX = 7;

export const ABILITY_SCORE_LIMITS = { min: 1, max: 21 } as const;

/**
 * Text a character update may set. `maxLength` is the longest the request accepts; the sanitizer
 * trims the text and cuts it to `storedLength`, which never exceeds the column size.
 */
export const CHARACTER_TEXT_BOUNDS = {
  name: { maxLength: 255, storedLength: 255 },
  trait1: { maxLength: 255, storedLength: 255 },
  trait2: { maxLength: 255, storedLength: 255 },
  habit: { maxLength: 1000, storedLength: 1000 },
  tale: { maxLength: 1000, storedLength: 1000 },
  bodyDescription: { maxLength: 1000, storedLength: 1000 },
  // VarChar(255) column: an accepted origin longer than that is cut to fit, never rejected.
  origin: { maxLength: 1000, storedLength: 255 },
  notes: { maxLength: 10000, storedLength: 10000 },
} as const;

/** Integer ranges a character update may set; the request rejects values outside them and the sanitizer clamps. */
export const CHARACTER_INTEGER_BOUNDS = {
  currentHp: { min: -100, max: 1000 },
  maxHp: { min: 1, max: 1000 },
  omens: { min: 0, max: 100 },
  maxOmens: { min: 0, max: 100 },
  silver: { min: 0, max: 1000000 },
  strength: ABILITY_SCORE_LIMITS,
  agility: ABILITY_SCORE_LIMITS,
  presence: ABILITY_SCORE_LIMITS,
  toughness: ABILITY_SCORE_LIMITS,
  miseryCount: { min: MISERY_MIN, max: MISERY_MAX },
} as const;

export type CharacterTextField = keyof typeof CHARACTER_TEXT_BOUNDS;
export type CharacterIntegerField = keyof typeof CHARACTER_INTEGER_BOUNDS;
