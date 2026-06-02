import { type ComputedModifier } from '@/hooks/models';

export function getComputedModifierKey(
  modifier: ComputedModifier,
  index: number,
): string {
  const identity =
    modifier.originKey ??
    modifier.originName ??
    modifier.source ??
    'computed-modifier';
  const excludes = (modifier.exclude ?? []).join('.');

  return [
    modifier.origin ?? 'computed',
    identity,
    modifier.statistic ?? 'stat',
    modifier.value ?? 0,
    excludes,
    index,
  ].join(':');
}
