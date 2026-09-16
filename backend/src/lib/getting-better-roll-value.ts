import {
  GettingBetterRuleError,
  type GettingBetterRoller,
  type RollValue,
} from './getting-better-types.js';

export function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new GettingBetterRuleError(`${label} must be an integer`);
  }
}

export function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new GettingBetterRuleError(`${label} must be finite`);
  }
}

export function assertRollValue(
  roll: RollValue,
  notation: string,
  min: number,
  max: number
): void {
  assertInteger(roll.total, `${notation} total`);
  if (roll.source !== 'server' && roll.source !== 'table') {
    throw new GettingBetterRuleError(`${notation} roll source is invalid`);
  }
  if (roll.total < min || roll.total > max) {
    throw new GettingBetterRuleError(
      `${notation} total ${roll.total} is outside ${min}-${max}`
    );
  }
  if (roll.dice !== undefined) {
    if (
      !Array.isArray(roll.dice) ||
      roll.dice.some((die) => !Number.isInteger(die))
    ) {
      throw new GettingBetterRuleError(`${notation} dice must be integers`);
    }
    if (roll.dice.reduce((sum, die) => sum + die, 0) !== roll.total) {
      throw new GettingBetterRuleError(
        `${notation} dice total does not match total`
      );
    }
  }
}

export async function rollValue(
  roller: GettingBetterRoller,
  notation: string,
  min: number,
  max: number
): Promise<RollValue> {
  const result = await roller.roll(notation);
  const value: RollValue = {
    source: 'server',
    ...(result.dice ? { dice: [...result.dice] } : {}),
    total: result.total,
  };
  assertRollValue(value, notation, min, max);
  return value;
}
