import { statToModifier } from './ability-modifiers.js';
import {
  assertFiniteNumber,
  assertInteger,
  assertRollValue,
  rollValue,
} from './getting-better-roll-value.js';
import {
  ABILITY_STATS,
  GettingBetterRuleError,
  type AbilityStat,
  type GettingBetterCatalog,
  type GettingBetterRoller,
  type HpImprovementCharacter,
  type ImprovementAbilityRoll,
  type ImprovementCharacterSnapshot,
  type ImprovementDebrisRoll,
  type ImprovementHpRoll,
  type RollValue,
  type ScrollFamily,
} from './getting-better-types.js';

export function scoreToModifierExtended(score: number): number {
  assertFiniteNumber(score, 'score');
  return statToModifier(score);
}

export function modifierToCanonicalScore(modifier: number): number {
  assertInteger(modifier, 'modifier');
  const scores: Record<number, number> = {
    [-3]: 4,
    [-2]: 5,
    [-1]: 7,
    0: 9,
    1: 13,
    2: 15,
    3: 17,
    4: 19,
    5: 20,
    6: 21,
  };
  const score = scores[modifier];
  if (score === undefined) {
    throw new GettingBetterRuleError(`unsupported modifier ${modifier}`);
  }
  return score;
}

export async function rollHpImprovement(
  character: HpImprovementCharacter,
  roller: GettingBetterRoller
): Promise<ImprovementHpRoll> {
  assertInteger(character.maxHp, 'character.maxHp');
  const check = await rollValue(roller, '6d10', 6, 60);
  const increase =
    check.total >= character.maxHp
      ? await rollValue(roller, '1d6', 1, 6)
      : null;
  return buildHpImprovement(character.maxHp, check, increase);
}

export async function rollDebris(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog
): Promise<ImprovementDebrisRoll> {
  const roll = await rollValue(roller, '1d6', 1, 6);
  if (roll.total <= 3) return { roll, kind: 'nothing' };

  if (roll.total === 4) {
    const silver = await rollValue(roller, '3d10', 3, 30);
    return { roll, kind: 'silver', silver, amount: silver.total };
  }

  const family: ScrollFamily = roll.total === 5 ? 'unclean' : 'sacred';
  const scroll = await rollCatalogEntry(roller, catalog, family);
  return {
    roll,
    kind: family === 'unclean' ? 'uncleanScroll' : 'sacredScroll',
    scroll: scroll.roll,
    itemKey: scroll.key,
  };
}

export async function rollAbilityImprovement(
  _stat: AbilityStat,
  rawScore: number,
  roller: GettingBetterRoller
): Promise<ImprovementAbilityRoll> {
  return buildAbilityImprovement(
    rawScore,
    await rollValue(roller, '1d6', 1, 6)
  );
}

export async function rollAbilityImprovements(
  abilities: Record<AbilityStat, number>,
  roller: GettingBetterRoller
): Promise<Record<AbilityStat, ImprovementAbilityRoll>> {
  const entries = await Promise.all(
    ABILITY_STATS.map(
      async (stat) =>
        [
          stat,
          await rollAbilityImprovement(stat, abilities[stat], roller),
        ] as const
    )
  );
  return Object.fromEntries(entries) as Record<
    AbilityStat,
    ImprovementAbilityRoll
  >;
}

export function normalizeSubmittedHp(
  hp: ImprovementHpRoll,
  snapshot: ImprovementCharacterSnapshot
): ImprovementHpRoll {
  return buildHpImprovement(snapshot.maxHp, hp.check, hp.increase);
}

export function normalizeSubmittedDebris(
  debris: ImprovementDebrisRoll,
  catalog: GettingBetterCatalog
): ImprovementDebrisRoll {
  assertRollValue(debris.roll, '1d6', 1, 6);
  if (debris.roll.total <= 3) return { roll: debris.roll, kind: 'nothing' };

  if (debris.roll.total === 4) {
    if (debris.kind !== 'silver') {
      throw new GettingBetterRuleError(
        'silver debris result requires a silver roll'
      );
    }
    assertRollValue(debris.silver, '3d10', 3, 30);
    return {
      roll: debris.roll,
      kind: 'silver',
      silver: debris.silver,
      amount: debris.silver.total,
    };
  }

  if (debris.kind !== 'uncleanScroll' && debris.kind !== 'sacredScroll') {
    throw new GettingBetterRuleError(
      'scroll debris result requires a scroll roll'
    );
  }

  const family: ScrollFamily = debris.roll.total === 5 ? 'unclean' : 'sacred';
  const expectedKind = family === 'unclean' ? 'uncleanScroll' : 'sacredScroll';
  if (debris.kind !== expectedKind) {
    throw new GettingBetterRuleError(
      'scroll debris family does not match the debris roll'
    );
  }

  return {
    roll: debris.roll,
    kind: expectedKind,
    scroll: debris.scroll,
    itemKey: catalogKeyFromRoll(catalog, family, debris.scroll),
  };
}

export function normalizeSubmittedAbilities(
  abilities: Record<AbilityStat, ImprovementAbilityRoll>,
  snapshot: ImprovementCharacterSnapshot
): Record<AbilityStat, ImprovementAbilityRoll> {
  const normalized = {} as Record<AbilityStat, ImprovementAbilityRoll>;
  for (const stat of ABILITY_STATS) {
    const submitted = abilities[stat];
    if (!submitted) {
      throw new GettingBetterRuleError(`missing ${stat} ability improvement`);
    }
    normalized[stat] = buildAbilityImprovement(
      snapshot.abilities[stat],
      submitted.roll
    );
  }
  return normalized;
}

function buildHpImprovement(
  fromMaxHp: number,
  check: RollValue,
  increase: RollValue | null
): ImprovementHpRoll {
  assertRollValue(check, '6d10', 6, 60);
  const succeeds = check.total >= fromMaxHp;
  let normalizedIncrease: RollValue | null = null;
  let toMaxHp = fromMaxHp;

  if (succeeds) {
    if (increase === null) {
      throw new GettingBetterRuleError(
        'successful HP improvement requires an increase roll'
      );
    }
    assertRollValue(increase, '1d6', 1, 6);
    normalizedIncrease = increase;
    toMaxHp = fromMaxHp + increase.total;
  } else if (increase !== null) {
    throw new GettingBetterRuleError(
      'failed HP improvement must not include an increase roll'
    );
  }

  return { check, fromMaxHp, succeeds, increase: normalizedIncrease, toMaxHp };
}

function buildAbilityImprovement(
  rawScore: number,
  roll: RollValue
): ImprovementAbilityRoll {
  assertInteger(rawScore, 'rawScore');
  assertRollValue(roll, '1d6', 1, 6);
  const fromModifier = scoreToModifierExtended(rawScore);
  const toModifier =
    fromModifier <= 1
      ? roll.total === 1
        ? Math.max(-3, fromModifier - 1)
        : Math.min(6, fromModifier + 1)
      : roll.total >= fromModifier
      ? Math.min(6, fromModifier + 1)
      : Math.max(-3, fromModifier - 1);

  return {
    roll,
    fromScore: rawScore,
    fromModifier,
    toModifier,
    toScore: modifierToCanonicalScore(toModifier),
    outcome:
      toModifier > fromModifier
        ? 'increase'
        : toModifier < fromModifier
        ? 'decrease'
        : 'same',
  };
}

async function rollCatalogEntry(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
  family: ScrollFamily
): Promise<{ key: string; roll: RollValue }> {
  const keys = catalog.scrollKeys(family);
  if (keys.length === 0) {
    throw new GettingBetterRuleError(`catalog has no ${family} scrolls`);
  }
  const roll = await rollValue(roller, `1d${keys.length}`, 1, keys.length);
  return { key: keys[roll.total - 1], roll };
}

function catalogKeyFromRoll(
  catalog: GettingBetterCatalog,
  family: ScrollFamily,
  roll: RollValue
): string {
  const keys = catalog.scrollKeys(family);
  if (keys.length === 0) {
    throw new GettingBetterRuleError(`catalog has no ${family} scrolls`);
  }
  assertRollValue(roll, `1d${keys.length}`, 1, keys.length);
  return keys[roll.total - 1];
}
