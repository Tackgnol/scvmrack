import { describe, it, expect } from 'vitest';
import { buildAggregateKey } from '../../../src/components/inventory/buildAggregateKey';

describe('buildAggregateKey', () => {
  it('should build a key from aggregated item', () => {
    const item = { name: 'Sword' };
    const aggregated = {
      item,
      indices: [2, 5],
      count: 2,
    };
    expect(buildAggregateKey(aggregated as any)).toBe('sword-2');
  });

  it('should use default name if name is missing', () => {
    const item = {};
    const aggregated = {
      item,
      indices: [0],
      count: 1,
    };
    expect(buildAggregateKey(aggregated as any)).toBe('item-0');
  });

  it('should use default index if indices is empty', () => {
    const item = { name: 'Dagger' };
    const aggregated = {
      item,
      indices: [],
      count: 0,
    };
    expect(buildAggregateKey(aggregated as any)).toBe('dagger-0');
  });
});
