import { ALL_CONTEXTS, scopeIncludeOptions } from '@components/modifiers/config';
import { type IncludeContext, type ModifierTileSpan, type ScopeOption } from '@components/modifiers/types';

const hasSameValues = (a: IncludeContext[], b: IncludeContext[]): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

export const includesToExclude = (includes: IncludeContext[]): IncludeContext[] =>
  ALL_CONTEXTS.filter((context) => !includes.includes(context));

const ADDED_CONTEXTS: string[] = ['test', 'heal', 'buff', 'item'];

/**
 * The contexts a modifier applies to. A narrowed list saved before test, heal,
 * buff and item existed names none of them, and never meant to include them.
 */
export const excludeToIncludes = (exclude: string[]): IncludeContext[] => {
  const legacy = exclude.length > 0 && !exclude.some((context) => ADDED_CONTEXTS.includes(context));
  return ALL_CONTEXTS.filter(
    (context) => !exclude.includes(context) && !(legacy && ADDED_CONTEXTS.includes(context)),
  );
};

export const resolveScopeFromIncludes = (
  includes: IncludeContext[],
): ScopeOption =>
  scopeIncludeOptions.find((option) => hasSameValues(option.include, includes))
    ?.value ?? 'all';

/** The exclusions a scope preset stores. */
export const scopeToExclude = (scope: ScopeOption): IncludeContext[] =>
  includesToExclude(scopeIncludeOptions.find((option) => option.value === scope)?.include ?? []);

/** Which preset a stored exclusion list matches. */
export const scopeOfExclude = (exclude: string[]): ScopeOption =>
  resolveScopeFromIncludes(excludeToIncludes(exclude));

type BentoSize = 'short' | 'medium' | 'full';

const resolveBentoSize = (nameLength: number): BentoSize => {
  if (nameLength >= 34) {
    return 'full';
  }
  if (nameLength >= 17) {
    return 'medium';
  }
  return 'short';
};

export const getModifierTileSpan = (nameLength: number): ModifierTileSpan => {
  const size = resolveBentoSize(nameLength);
  if (size === 'full') {
    return { col: 6, row: 2, full: true };
  }
  if (size === 'medium') {
    return { col: 3, row: 1, full: false };
  }
  return { col: 2, row: 1, full: false };
};
