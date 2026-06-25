import { ALL_CONTEXTS, scopeIncludeOptions } from '@components/modifiers/config';
import { type IncludeContext, type ModifierTileSpan, type ScopeOption } from '@components/modifiers/types';

const hasSameValues = (a: IncludeContext[], b: IncludeContext[]): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

export const includesToExclude = (includes: IncludeContext[]): IncludeContext[] =>
  ALL_CONTEXTS.filter((context) => !includes.includes(context));

export const excludeToIncludes = (exclude: string[]): IncludeContext[] =>
  ALL_CONTEXTS.filter((context) => !exclude.includes(context));

export const resolveScopeFromIncludes = (
  includes: IncludeContext[],
): ScopeOption =>
  scopeIncludeOptions.find((option) => hasSameValues(option.include, includes))
    ?.value ?? 'all';

let fallbackModifierIdSequence = 0;

export const createModifierId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  fallbackModifierIdSequence += 1;
  return `modifier-${Date.now().toString(36)}-${fallbackModifierIdSequence.toString(36)}`;
};

type BentoSize = 'short' | 'medium' | 'full';

const resolveBentoSize = (nameLength: number): BentoSize => {
  if (nameLength >= 34) return 'full';
  if (nameLength >= 17) return 'medium';
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
